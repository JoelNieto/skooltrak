# Product specs: FRDs and vertical slices

This folder is the source of truth for **what** Skooltrak does and **why**.
Code says how; `.kilo/plans/` holds one-off implementation plans. When a plan and an FRD disagree, the FRD wins.
In that case, fix whichever one is wrong.

```
docs/product/
  README.md            ← this file (the process)
  capabilities.md      ← map of every bounded context, its capabilities and FRD index
  personas.md          ← who uses the product and what each role may do
  frd/
    _template.md
    <CTX>-<NNN>-<slug>.md
  slices/
    _template.md
    <CTX>-<NNN>-S<NN>-<slug>.md
```

## Vocabulary

| Term | Meaning |
|---|---|
| **Context** | A bounded context (business area) with a 3-letter code, e.g. `ASM` = Assessment. Listed in [capabilities.md](capabilities.md). |
| **FRD** | Functional Requirements Document. It covers one feature a persona would recognise, such as "Grade publishing". It describes behaviour, not implementation. |
| **FR** | One testable functional requirement inside an FRD: `FR-ASM-001.3`. |
| **BR** | A business rule that constrains FRs: `BR-ASM-001.2`. |
| **Slice** | The smallest end-to-end increment a user can see. It goes DB → API → client → UI → test and ships in 1–3 days. |

## IDs

- FRD: `<CTX>-<NNN>`. The number is sequential per context and never reused, e.g. `COM-002`.
- Requirement: `FR-<CTX>-<NNN>.<n>`; rule: `BR-<CTX>-<NNN>.<n>`.
- Slice: `<CTX>-<NNN>-S<NN>`, e.g. `COM-002-S04`.
- Branch: `feat/<slice-id>-<slug>`, e.g. `feat/COM-002-S04-block-self-approval`.
- Commit scope: `feat(COM-002-S04): …`.
- Playwright: tag tests with the FR they prove, e.g. `test('… @FR-COM-002.4', …)`. Running `--grep @FR-COM-002` checks a whole FRD.

## Lifecycle

```
FRD:    Draft ──► Ready ──► In build ──► Shipped ──► (Deprecated)
Slice:  Proposed ──► Ready ──► In progress ──► Done
```

**FRD is Ready when:**
- the problem, personas and success metric are filled in;
- every FR is testable and has an owner persona;
- permissions use existing `Perm.*` keys, or new ones are listed explicitly;
- tenancy scope is stated (org, school, class-group or self);
- open questions are answered or explicitly deferred;
- it is cut into ordered slices, and the first slice is Ready.

**Slice is Done when:**
- all acceptance criteria pass, including at least one Playwright test tagged with its FR IDs;
- the API is behind `@RequirePermissions(...)` and scoped to the caller's organization, with a test proving cross-tenant access is refused;
- the UI uses `libs/ui` components only, with no raw palette colours;
- the OpenAPI client is regenerated (`bun run openapi:orval`) if the API changed;
- the FRD's slice table and `capabilities.md` status are updated.

## Workflow

1. **Capture**: add or extend a row in [capabilities.md](capabilities.md).
2. **Specify**: copy `frd/_template.md` (or run `/frd <idea>` in Claude Code) and fill it in up to **Ready**.
3. **Slice**: cut the FRD into vertical slices. Order them so the first one delivers the thinnest useful path, and later slices add rules, edge cases and polish.
4. **Build**: one slice = one branch = one PR. A slice should only touch libs/modules of its own context.
5. **Close**: mark the slice Done. When all slices are Done, the FRD becomes Shipped.

### What makes a good slice

- It is **vertical**: it crosses every layer it needs (migration → Nest service/controller → OpenAPI → Angular data-access → component → e2e). "Backend for X" and "UI for X" are layers, not slices.
- A real persona **can see and verify** it in the running app.
- It is **independently shippable**: if work stops after this slice, nothing is half-built. Hide unfinished paths behind permissions or flags if needed.
- It is **small**: 1–3 days. If it's bigger, split by persona, by rule, by happy path vs edge cases, or by read vs write.

## As-is FRDs for existing features

Most of the product already exists without FRDs. Document it gradually; don't stop feature work to do it:

- Write an **as-is FRD** (status `Shipped`) the first time you are about to change a feature, so the change is a diff against documented behaviour.
- Derive it from the code (controller, service rules, routes), not from memory. Record gaps you find as **Open questions** or new **Proposed** slices.
- [COM-002 Broadcasts](frd/COM-002-broadcasts.md) is the worked example.

## Alignment with the codebase

| Product | Code |
|---|---|
| Context `ASM` | Nx tag `ctx:asm` (planned), backend module(s) under `apps/dashboard-backend/src/app/<module>`, frontend routes in `apps/web-dashboard` |
| FR permission | `Perm.*` in `prisma/scripts/seed-roles-permissions.ts` and `@RequirePermissions` |
| Tenancy scope | `organizationId` / `schoolId` filter in the service |
| Persona | Seeded role (`ORG_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `SYSADMIN`) |
