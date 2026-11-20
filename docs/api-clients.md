# OpenAPI specs and generated clients

`libs/api-client-dashboard` and `libs/api-client-admin` hold each backend's OpenAPI spec (`openapi.json`) and an Angular client generated from it by [orval](https://orval.dev) (`src/lib/generated`). Both are committed.

## Regenerating

```sh
bun run openapi
```

This runs `nx run-many -t openapi -p dashboard-backend admin-backend`. For each backend the `openapi` target:

1. builds the app (`dependsOn: build`);
2. runs `dist/apps/<app>/main.js` with `OPENAPI_EXPORT=true`. `main.ts` builds the Swagger document with the same `createOpenApiDocument()` (`src/openapi.ts`) that serves `/api/openapi.json`, writes it to `OPENAPI_OUTPUT` and exits before `app.init()`. No database, port or real secrets are needed: the target sets placeholder `DATABASE_URL` and `RESEND_API_KEY`, and `OPENAPI_EXPORT` also skips the Prisma connection, the scheduler and the real better-auth instance;
3. runs `orval --project api-client-<app> --clean` against the new spec.

Run one backend with `bun nx run dashboard-backend:openapi`.

Run it whenever a controller, DTO or route changes, and commit the result in the same PR. The **OpenAPI clients up to date** job in `.github/workflows/ci.yml` runs the same command and fails if `libs/api-client-*` changes.

## What the spec does and does not say

- Paths, parameters and request bodies come from controllers and `@ApiProperty` DTOs.
- **Responses are untyped.** No controller declares `@ApiOkResponse({ type })` and the Nest Swagger CLI plugin is not enabled, so every generated method returns `Observable<void>` unless you pass `TData`. Response classes such as `home/entities/*.entity.ts` exist but are not wired to their routes.
- Errors thrown in services (`ForbiddenException`, etc.) are not listed unless the route declares them (`@ApiForbiddenResponse`).

## Adoption decision (#35)

**Keep the libs; adopt the generated clients one feature at a time. Don't migrate existing pages in bulk.**

- The spec is now the API contract under CI, which is useful on its own: route removals and DTO changes show up in PR diffs.
- Because responses are untyped, the generated services add little over a hand-written `HttpClient` / `httpResource` call today. The generated **request types** (`models/*Input`, `*Params`) are usable now.
- A feature moves to the generated client when a slice touches it **and** its controller declares response types (`@ApiOkResponse({ type: ... })`). That slice adds the decorators, regenerates, and switches the feature's data-access to the generated service. `web-dashboard` keeps its hand-written services until then.
- To import the libs from an app, add a barrel (`src/index.ts`) and a `tsconfig.base.json` path (`@/api-client-dashboard`) in the first slice that adopts one.
