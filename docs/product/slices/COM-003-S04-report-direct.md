# COM-003-S04 — Report a direct conversation; admins review it read-only

| | |
|---|---|
| **FRD** | [COM-003](../frd/COM-003-channels-and-direct.md) |
| **Implements** | FR-COM-003.20; BR-COM-003.14 (and BR .9 kept) |
| **Status** | In review |
| **Branch** | `feat/COM-003-S04-report-direct` |
| **Estimate** | 2 days |
| **Decided** | 2026-11-25: admins read a direct conversation only after a participant reports it; read-only and logged |

## User-visible outcome
"As a parent or teacher, I can report a direct conversation; the school's admins can then read it, without writing in it, and every time they do is recorded."

## Acceptance criteria
```gherkin
Background:
  Given the teacher wrote to Paula about Ana: "Ana no entregó la tarea hoy."

Scenario: nobody but the participants sees an unreported conversation @BR-COM-003.9 @BR-COM-003.14
  When an admin asks for it
  Then they get 404

Scenario: a participant reports it @FR-COM-003.20
  When Paula opens the conversation and presses "Reportar conversación"
  And writes "El tono del mensaje no me pareció adecuado." and presses "Enviar reporte"
  Then the conversation shows "Reportada"

Scenario: only participants report, only admins review @BR-COM-003.14
  When another teacher tries to report it, they get 404 (its existence isn't revealed)
  When the teacher asks for the reports list or the review, they get 403

Scenario: the admin reviews it, read-only and logged @FR-COM-003.20 @BR-COM-003.14
  When an admin opens "Conversaciones reportadas"
  Then the report is listed as "Abierto", with the reason and who reported it
  When they open it
  Then they read its messages, with "Solo lectura" and no reply box
  And "Accesos registrados" lists their access

Scenario: the admin resolves it @FR-COM-003.20
  When they write "Hablé con el docente y con la familia." and press "Resolver reporte"
  Then the report is listed as "Resuelto"
  And opening the conversation again gets 404 (no open report)
  And resolving it again gets 400
```

## Layers touched
- [ ] Prisma migration `20261125130000_direct_conversation_reports`:
  - `DirectConversationReport` (`conversationId`, `reportedById`, `reason`, `createdAt`, `resolvedAt`, `resolvedById`, `resolution`);
  - `DirectConversationAccess` (`conversationId`, `adminUserId`, `accessedAt`).
- [ ] Nest (`communication/direct.service.ts`, `communication.controller.ts`), all behind `COMMUNICATION_DIRECT`:
  - `POST direct/:id/report` (`ReportDirectInput`): participants only. Anyone else gets `404`, as BR .9 already answers.
  - `GET direct/reports`: admins only (`403`), their organization's reports, open first.
  - `GET direct/reports/conversations/:id`: admins only, same organization, and only with an open report (`404` otherwise). It logs a `DirectConversationAccess` and returns the messages, reports and access log. Nothing is marked read.
  - `POST direct/reports/:reportId/resolve` (`ResolveDirectReportInput`): admins only; `400` once resolved.
  - `GET direct/:id` gains `reported` for the participants.
  - Logs carry ids only (§8). Admins never write: there is no admin send path.
- [ ] Shared: `DirectReport`, `DirectReview`; `DirectConversationDetail.reported`.
- [ ] OpenAPI: no change (shared types, as in S02).
- [ ] Angular:
  - `communication/direct.ts`: *"Reportar conversación"* with a reason, and *"Reportada"* once reported.
  - New `communication/direct-reports.ts` page at `/communication/direct-reports[/:id]` (`adminGuard`): the reports list, the read-only conversation, the reports with a resolve form, and *"Accesos registrados"*.
  - A sidebar link, *Conversaciones reportadas*, for admins; a `flag` icon.
- [ ] Tests:
  - Nest unit (`direct-reports.spec.ts`): participants only; admins only; the review logs every opening and marks nothing read; unreported and other-organization conversations are `404`; resolving once; `reported` on the detail.
  - Playwright `communication/direct-reports.after.spec.ts` (`@FR-COM-003.20 @BR-COM-003.14`).

## Out of scope for this slice
- Notifying admins of a new report (email), and telling participants when an admin opened their conversation.
- Admins writing in, or closing, a reported conversation.

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (unit + e2e)
- [ ] `libs/ui` components only, no raw palette colours
- [ ] FRD slice table + `capabilities.md` updated
