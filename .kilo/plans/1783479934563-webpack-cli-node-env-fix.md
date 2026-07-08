# Fix `--node-env` webpack-cli build failure

## Problem

Backend builds fail with:

```
[webpack-cli] Error: Unknown option '--node-env=development'
```

`webpack-cli` was upgraded to `7.0.3` (see `package.json:150`). In this version the
`--node-env` flag was removed and replaced by `--config-node-env`, which sets
`process.env.NODE_ENV` for use within the config.

The build targets in the two NestJS backend apps still pass the old `--node-env` flag,
so both production and development configurations fail.

## Why `--config-node-env` is the correct replacement

- `apps/admin-backend/webpack.config.js:7` and `apps/dashboard-backend/webpack.config.js:7`
  branch on `process.env.NODE_ENV !== 'production'`.
- `@nx/webpack`'s `NxAppWebpackPlugin` derives prod/dev mode from
  `process.env.NODE_ENV === 'production'`
  (`node_modules/@nx/webpack/dist/src/plugins/nx-webpack-plugin/lib/normalize-options.js:12`).
- `webpack-cli build --config-node-env=<value>` sets `process.env.NODE_ENV` to that value,
  preserving the exact previous behavior. Verified via `webpack-cli build --help`.

## Changes

Replace every `--node-env=` arg with `--config-node-env=` in the two backend `project.json` files.

1. `apps/admin-backend/project.json`
   - `targets.build.options.args`: `"--node-env=production"` -> `"--config-node-env=production"` (line 12)
   - `targets.build.configurations.development.args`: `"--node-env=development"` -> `"--config-node-env=development"` (line 17)

2. `apps/dashboard-backend/project.json`
   - `targets.build.configurations.development.args`: `"--node-env=development"` -> `"--config-node-env=development"` (line 16)
   - Note: `dashboard-backend`'s base `build.options` has no `args` (no explicit production
     node-env). Leave as-is; only the development configuration needs updating.

No changes required to the `webpack.config.js` files — they read `process.env.NODE_ENV`,
which `--config-node-env` continues to set.

## Validation

Run through Nx (the webpack config requires the Nx executor's project-graph context; running
`webpack-cli` directly from the app dir fails with an unrelated `reading 'data'` error):

- `bunx nx build admin-backend --configuration=development`
- `bunx nx build admin-backend --configuration=production` (or `bunx nx build admin-backend`)
- `bunx nx build dashboard-backend --configuration=development`
- `bunx nx build dashboard-backend`

Expected: all builds complete without the `Unknown option` error and emit to
`dist/apps/<app>`. Optionally spot-check that a development build produces sourcemaps /
`devtoolModuleFilenameTemplate` behavior (dev branch) and a production build does not.

Also sanity-check `serve` still works since it depends on `build:development`:

- `bunx nx serve admin-backend`
- `bunx nx serve dashboard-backend`

## Risks / Notes

- Low risk, mechanical flag rename in two config files.
- If any CI scripts, Dockerfiles, or `railway.json` invoke `webpack-cli ... --node-env`
  directly (outside project.json), they need the same rename. A quick grep for
  `node-env` across the repo before finishing is recommended.
