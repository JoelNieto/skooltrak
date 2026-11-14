---
name: frd
description: Draft or update a Skooltrak Functional Requirements Document (FRD) and cut it into vertical slices under docs/product/. Use when the user wants to spec a feature, write an FRD, document an existing feature "as-is", plan slices, or asks "/frd <idea>" / "/frd as-is <feature>" / "/frd slice <FRD-ID>".
---

# FRD & slice authoring (Skooltrak)

The process and conventions live in `docs/product/README.md`. Read it first, then follow it exactly. Templates: `docs/product/frd/_template.md`, `docs/product/slices/_template.md`. Worked example: `docs/product/frd/COM-002-broadcasts.md`.

## Modes

- `/frd <idea>`: **new feature**. Write a Draft FRD.
- `/frd as-is <feature>`: **reverse-engineer** an existing feature into a Shipped FRD.
- `/frd slice <CTX-NNN>`: cut an existing FRD into slices, or add one, and write the first slice file.

## Steps

1. **Place it.** Pick the context code from `docs/product/capabilities.md`. Find the next free number with `ls docs/product/frd/<CTX>-*`. Never reuse a number. If no context fits, propose a new one and add it to `capabilities.md`.
2. **Ground it in code; never invent behaviour.** For the area involved, read:
   - the Nest module: `apps/dashboard-backend/src/app/<module>/` (controller for endpoints and `@RequirePermissions`, service for rules, `throw` sites for error behaviour)
   - the Prisma models in `prisma/schema.prisma`
   - the Angular routes in `apps/web-dashboard/src/app/dashboard.routes.ts` and the feature folder
   - permissions and roles in `prisma/scripts/seed-roles-permissions.ts`, personas in `docs/product/personas.md`
   - related plans in `.kilo/plans/`
   If `graphify-out/graph.json` exists, `graphify query "<feature>"` / `graphify explain "<Symbol>"` speeds this up.
3. **Write requirements.** Each FR is one testable behaviour from a persona's point of view. Each BR states the condition **and** what happens when it's violated (status code + message for the API, hidden/disabled for the UI). Every FR names its permission and tenancy scope.
4. **Record gaps.** In as-is mode, anything that looks wrong goes in **Open questions** with file evidence and a proposed slice id: missing tenant filter, missing ownership check, rule that contradicts the plan. Do not "fix" behaviour in the FRD; describe what the code does.
5. **Slice vertically.** Make the first slice the thinnest path a persona can verify. Every slice crosses all the layers it needs and fits in ≤ 3 days. Split by persona, rule, read/write, or happy/edge path. Each slice lists acceptance criteria in Gherkin, and its tests are tagged `@FR-…`.
6. **Update the indexes.** Link the FRD from its row in `capabilities.md` and fill in the FRD's slice table.
7. **Report back.** Give the file paths, the open questions that block **Ready**, and the recommended first slice. Ask the user about product decisions; do not guess them.

## Rules

- Write in English. Quote Spanish UI copy verbatim where it matters (labels, error toasts).
- Use the IDs exactly: `CTX-NNN`, `FR-CTX-NNN.n`, `BR-CTX-NNN.n`, `CTX-NNN-SNN`.
- Use existing `Perm.*` keys. If a new permission is needed, say so explicitly in the FRD and the slice; adding it to the seed is part of the slice.
- Do not change application code while writing FRDs.
