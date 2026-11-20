# <CTX>-<NNN>-S<NN> — <Slice title>

| | |
|---|---|
| **FRD** | [<CTX>-<NNN>](../frd/<CTX>-<NNN>-<slug>.md) |
| **Implements** | FR-<CTX>-<NNN>.x, BR-<CTX>-<NNN>.y |
| **Status** | Proposed · Ready · In progress · Done |
| **Branch** | `feat/<CTX>-<NNN>-S<NN>-<slug>` |
| **Estimate** | ≤ 3 days |

## User-visible outcome
<One sentence a persona would say after this ships: "As a teacher I can now …".>

## Acceptance criteria
```gherkin
Given <context>
When <action>
Then <observable result>
```

## Layers touched
- [ ] Prisma migration: …
- [ ] Nest (`apps/dashboard-backend/src/app/<module>`): service rule, controller + `@RequirePermissions(...)`, tenant filter
- [ ] OpenAPI → `bun run openapi`
- [ ] Angular data-access / store
- [ ] Angular UI (route, component, `libs/ui` primitives)
- [ ] Tests: Nest unit (incl. cross-tenant refusal), Playwright e2e tagged `@FR-<CTX>-<NNN>.x`

## Out of scope for this slice
- …

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test)
- [ ] FRD slice table + `capabilities.md` updated
