# <CTX>-<NNN> — <Feature name>

| | |
|---|---|
| **Status** | Draft · Ready · In build · Shipped · Deprecated |
| **Context** | <CTX> — <context name> (see [capabilities](../capabilities.md)) |
| **Owner** | <name> |
| **Last updated** | YYYY-MM-DD |
| **Related** | plans, FRDs, issues |

## 1. Problem & outcome
<One paragraph: who has which problem today, and what changes for them when this ships.>

**Success metric:** <observable measure, e.g. "80 % of grades published within 7 days of the assessment date">

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| Teacher | … | `Perm.MANAGE_X` | own courses |

## 3. Functional requirements
Each FR is one testable behaviour, written from the persona's point of view.

- **FR-<CTX>-<NNN>.1** — <Persona> can <action> so that <outcome>.
- **FR-<CTX>-<NNN>.2** — …

## 4. Business rules
- **BR-<CTX>-<NNN>.1** — <rule, with the exact condition and the result when it is violated (error / hidden / disabled)>.

## 5. Data
- Entities touched: `<Model>` (new fields: …)
- Tenancy: every read/write is filtered by `organizationId` (and `schoolId` / ownership where relevant).
- Audit: <what is logged, where>

## 6. API surface
| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `POST /api/v1/...` | … | `Perm.X` | .1 |

Events / side effects: <notifications, sockets, cron, emails>

## 7. UX
- Entry points (routes, sidebar items): …
- States: empty · loading · error · no permission · success
- Design-system components used: …

## 8. Non-functional
Performance, accessibility, i18n (UI is Spanish), privacy (minors' data), offline/mobile.

## 9. Out of scope
- …

## 10. Open questions
- [ ] …

## 11. Slices
| Slice | Title | FRs | Status |
|---|---|---|---|
| [<CTX>-<NNN>-S01](../slices/<CTX>-<NNN>-S01-<slug>.md) | Thinnest end-to-end path | .1 | Proposed |
