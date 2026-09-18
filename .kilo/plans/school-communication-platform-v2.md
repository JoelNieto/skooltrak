# School Communication Platform — Implementation Plan v2

> Status: **in progress**. This supersedes
> `.kilo/plans/1787920818475-school-communication-platform.md`.
> Derived from the live codebase (`prisma/schema.prisma`,
> `apps/dashboard-backend/src/app/communication/`, `apps/web-dashboard`).

## 0. What changed from v1

| v1 decision | v2 decision |
|---|---|
| New `web-family` Angular PWA for parents/students | **Dropped.** Parents use the existing father profile in `web-dashboard`. |
| Parent inbox at a dedicated family app (and later `/family`) | **Single surface:** `apps/web-dashboard` route `/parent/communication` (sidebar: **Mensajes**). |
| Phase 0 “no UI clients yet” | Phase 0 backend **is already in the repo**. Teacher UI is a working first cut. Parent UI is not. |
| REST + Socket.IO (not GraphQL) | **Keep REST.** The communication module is already REST + Socket.IO namespace `/communication`. Do not rebuild as GraphQL. |
| `web-admin` in scope for school staff | Unchanged: **out of scope.** School staff live in `web-dashboard`. `web-admin` mock parent/teacher comms pages are leftover and should not be extended. |

### Locked product rules (still true)

1. **Full replace + migrate** — new `communication_*` tables are the source of truth. Legacy `Chat` / `ChatMessage` / `ChatParticipant` and `Message` / `MessageRecipient` / `Notification` stay until Phase 6, then freeze or backfill and delete.
2. **Parents are reply-only.** They cannot create threads or add participants. Enforced by `CanInitiateGuard` on the API. The parent page must not show “Enviar mensaje” / “Nuevo hilo”. **Phase 1 is parents only** — no student inbox, even though students may still be participants on class threads.
3. **Delivery engine = Novu (self-hosted OSS)** for channel fan-out. Prisma remains the audit/receipt source of truth. Current fan-out is a **stub** (marks `SENT`, stamps `stub-*` event ids).
4. **Emergency voice = deferred** (Phase 5). Emergency in Phase 2 = push + SMS + email, bypass quiet hours.
5. **Translation = deferred** (Phase 4). `TranslationService` no-op seam already exists.
6. **Staff role = `ORG_ADMIN` for now.** Broadcast/approve guards stay on **permissions** (`COMMUNICATION_BROADCAST`, `COMMUNICATION_APPROVE`), not hardcoded role names, so later staff roles slot in.
7. **Clients = `web-dashboard` only** for this platform. Teacher workspace + parent portal + org-admin console all live there. Native/Capacitor later.

### Stack (keep what exists)

- **Frontend:** Angular 21 + Tailwind + DaisyUI in `apps/web-dashboard`. Shared `libs/ui` thread primitives (`ThreadList`, `ThreadComposer`, `MessageBubble`).
- **Backend:** NestJS `apps/dashboard-backend/src/app/communication/` (REST). Socket.IO namespace `/communication`.
- **DB:** PostgreSQL + Prisma 7. Models already match v1 with one rename: `CommunicationMessage` (table `communication_messages`) so it does not collide with legacy `Message`.
- **Auth:** better-auth `Member`/role + `Perm.COMMUNICATION_*`. Route guards today still use `VIEW_MESSAGES` / `MANAGE_MESSAGES` — align later (see Phase 1 polish).

---

## 1. Current state (as of 2026-09-17)

Legend: **done** / **partial** / **not started**.

### Phase 0 — Foundations — **mostly done**

| Item | Status | Notes |
|---|---|---|
| Prisma models (`CommunicationThread`, `ThreadParticipant`, `CommunicationMessage`, `MessageDelivery`, `RecipientPreference`, `CommunicationAuditLog`) | **done** | Plus `broadcast` boolean and extra indexes vs v1. |
| NestJS `CommunicationModule` + REST controller | **done** | All v1 routes exist under `v1/communication`. |
| Socket.IO gateway (`thread:message.new`, `thread:typing`, `delivery:update`) | **done** | Auth on handshake; join requires participant row. |
| Roster derivation (class group / student guardians) | **done** | Materialized as `ThreadParticipant` on create. |
| Reply-only guard | **done** | Role-based (`PARENT`, `STUDENT`). |
| Permissions seeded | **done** | `COMMUNICATION_VIEW` (parent/teacher/student), `COMMUNICATION_BROADCAST` (teacher + org-admin), `COMMUNICATION_APPROVE` (org-admin via ALL). |
| Novu subscriber sync + webhook reconciliation | **partial** | API + idempotent upsert exist. **No Novu deployed.** Fan-out is in-process stub. Webhook sits behind `BetterAuthGuard` — real Novu cannot call it. |
| `TranslationService` no-op | **done** | Not called on send path yet (fine). |
| `CommunicationRetentionService` | **partial** | Methods exist; no HTTP surface, no scheduled job, not wired to user-delete. |
| Shared UI primitives | **done** | `libs/ui` thread list / composer / bubble. |
| Input validation | **not started** | DTOs in `communication.input.ts` have **no `class-validator`**. Against NestJS workspace rules. |
| Automated tests | **not started** | No `*.spec.ts` for communication. |

### Phase 1 — Teacher ↔ Family — **done (in-app)**

| Item | Status | Notes |
|---|---|---|
| Teacher workspace `/teacher/communication` | **partial** | Real API: list, create `CLASS_GROUP` / `STUDENT_GUARDIANS`, live messages, in-app read receipts. Gaps below. |
| Parent inbox on **father profile** `/parent/communication` | **not started** | Still a **mock card list** (`parent-teacher-communication.ts`). Action button says “Enviar mensaje” (violates reply-only). |
| Duplicate parent route `/family` (`family-chat.ts`) | **accidental leftover** | Wired to the real API and parent-guarded, but it is the abandoned `web-family` stand-in. Sidebar shows both **Chat de familia** (`/family`) and **Mensajes** (`/parent/communication`). **Delete `/family` after the father page is real.** |
| Tiers `ROUTINE` + `IMPORTANT` | **partial** | Create-thread form has both. Composer does **not** let the teacher pick urgency per message (`composerUrgency` is unused). |
| In-app live delivery | **partial** | Works in teacher view. Parent mock page has no socket. `family-chat` disconnects the whole socket on thread leave (bug). |
| Push (FCM via Novu) + email fallback + ROUTINE digest | **not started** | Stub only. |
| Per-recipient read receipts | **partial** | IN_APP mark-read + teacher “Leído por X de Y”. No real channel receipts. |
| First message on thread create | **missing** | Teacher form creates an empty thread (title only). Parent sees nothing until a later send. |
| Parent home “Mensajes nuevos” | **legacy** | `parent-home.ts` still reads `/api/v1/messages` (old inbox), not communication threads. |

### Phase 2 — Org-Admin/Staff console — **done (in-app)**

| Item | Status | Notes |
|---|---|---|
| `POST /broadcasts` + approval + fan-out | **done** | School-wide always `PENDING_APPROVAL` and school-scoped. Class broadcasts from staff auto-approve. Pending hidden from parent inbox. |
| `GET /broadcasts` + `GET /admin/audit` | **done** | Audit is org-scoped; actor included. |
| Admin UI in `web-dashboard` | **done** | `/admin/communication`: composer, approval queue, recent list, audit. Sidebar **Comunicados**. |
| Emergency tier | **partial** | In-app badge + quiet-hours bypass. No SMS/email/push until Novu. |

### Phase 3 — Delivery hardening — **in progress (no Novu yet)**

| Item | Status | Notes |
|---|---|---|
| Quiet hours / timezone / channel prefs | **done (policy)** | Evaluated at materialize + preview. `EMERGENCY` bypasses quiet hours. Non-in-app channels omitted during quiet hours. |
| Novu webhook HMAC | **done (seam)** | Public `POST /webhooks/novu` with `x-novu-signature`. Requires `NOVU_WEBHOOK_SECRET`. |
| SMS (Twilio via Novu) | **not started** | Channel enum + pref flag only. |
| Web-push / VAPID / service worker | **not started** | `WebPushService` has placeholder `<<VAPID_PUBLIC_KEY>>` and is never registered. No SW. |
| Offline outbox | **done** | Parent + teacher inboxes enqueue offline and flush on `online`. |
| Socket.IO Redis adapter | **not started** | |
| Deploy Novu / `dispatchToNovu` | **not started** | Fan-out is still the in-process stub. |

### Phase 4 / 5 / 6 — **not started**

Translation, Twilio Voice, and legacy decommission are unchanged from v1.

---

## 2. Data model (keep; already migrated)

No schema redesign. The live models are the contract.

Notes vs v1 draft:

- Table `messages` became `communication_messages` (`CommunicationMessage`) to avoid the legacy `Message` model.
- `CommunicationThread.broadcast Boolean @default(false)` was added — keep it; approval flow depends on it.
- `MessageDelivery.novuEventId` is `@unique` — required for webhook upserts.

Recipient derivation (unchanged, already implemented):

- `CLASS_GROUP` → students in the group **plus** their parents (`Parent.students`).
- `STUDENT_GUARDIANS` → that student’s parents.
- Rows are materialized as `ThreadParticipant` so receipts are explicit.

---

## 3. API surface (keep; harden)

Existing REST (do not duplicate in GraphQL):

**Threads / messages**

- `POST   /v1/communication/threads`
- `GET    /v1/communication/threads`
- `GET    /v1/communication/threads/:id`
- `POST   /v1/communication/threads/:id/messages`
- `POST   /v1/communication/threads/:id/messages/:mid/reply` (alias of send)
- `GET    /v1/communication/threads/:id/messages`
- `PATCH  /v1/communication/messages/:id/read`
- `POST   /v1/communication/threads/:id/typing`
- `WS     /communication` → `joinThread` / `leaveThread` / `typing` / `thread:message.new` / `thread:typing` / `delivery:update`

**Roster**

- `GET  /v1/communication/roster/class-group/:id/recipients`
- `GET  /v1/communication/roster/student/:id/guardians`
- `POST /v1/communication/threads/:id/participants` (`CanInitiateGuard`)

**Delivery seam**

- `POST /v1/communication/subscribers/sync`
- `POST /v1/communication/delivery/preview`
- `GET  /v1/communication/messages/:id/deliveries`
- `POST /v1/communication/webhooks/novu` ← must become **unguarded + HMAC** before real Novu
- `PATCH /v1/communication/recipients/:id/preference`

**Admin**

- `POST /v1/communication/broadcasts` (`COMMUNICATION_BROADCAST`)
- `POST /v1/communication/broadcasts/:id/approve` (`COMMUNICATION_APPROVE`)
- `GET  /v1/communication/admin/audit`

Harden in Phase 1 (backend, small):

1. Add `class-validator` to all inputs.
2. `createThread` accepts optional `body` and sends the first message in the same transaction (so parents actually receive something).
3. Scope `listThreads` for staff: teachers should see threads they **own or participate in**, not every org thread. Org-admin may see org-wide. Today `isStaff` includes `TEACHER` and pushes `{ organizationId }`, which leaks other teachers’ guardian threads.
4. Mark-read should emit `delivery:update` so the sender’s receipt line updates live (today only Novu webhook does).
5. Preference PATCH must only allow **self** (or org-admin), not arbitrary `:id`.
6. Webhook: strip `BetterAuthGuard`, verify Novu signature. Until Novu is live, leave stub fan-out.

---

## 4. Frontend surfaces (v2)

All in `apps/web-dashboard`. **No new app.**

### 4.1 Parent — father profile (Phase 1, highest priority)

**Canonical route:** `/parent/communication`  
**Nav label:** Mensajes (already in the Padres sidebar).  
**File:** replace `apps/web-dashboard/src/app/parent/parent-teacher-communication.ts`.

Behavior:

- Reply-only inbox: thread list + transcript + composer. Reuse `libs/ui` + `CommunicationApi` + `CommunicationSocket` (same pattern as the teacher page).
- No “Nuevo mensaje” / “Enviar mensaje” header action.
- Empty state: “Cuando un docente te escriba, el mensaje aparecerá aquí.”
- Mark received messages read; show urgency badges; Spanish copy.
- Optional: filter by linked child (`ParentContext`) if the thread `scopeId` matches a student, without making child-selection a hard prerequisite (parent home is still all-children).

**Remove after cutover:**

- Route `/family` and `apps/web-dashboard/src/app/communication/family-chat.ts`.
- Sidebar item **Chat de familia**.
- Do not port `family-chat` bugs (full socket disconnect on leave, optimistic temp ids never reconciled, English strings, emergency badge on `urgencyDefault`).

**Also in Phase 1:**

- `parent-home.ts` “Mensajes nuevos” + recent list → `GET /v1/communication/threads` (unread via `lastReadAt` / deliveries), link to `/parent/communication`. Stop using `/api/v1/messages`.
- Keep `/parent/notifications` as a **separate** alerts page (attendance/grades). Out of this plan unless we later feed communication unread into it.

### 4.2 Teacher — keep `/teacher/communication` (Phase 1 polish)

Keep the working page. Fix:

- Create thread **with initial body** (form field + API `body`).
- Wire per-message urgency in the composer (or send using thread `urgencyDefault`).
- Fix thread-list crash when a thread has zero messages (`messages[0]`).
- Audience names: prefer participant/user payload from the API instead of extra student/class-group fetches when possible.
- Spanish composer placeholder (shared `ThreadComposer` currently defaults to English).

### 4.3 Org-admin console (Phase 2)

New pages under `apps/web-dashboard/src/app/admin/` (not `web-admin`):

- Broadcast composer: class / school, urgency including `EMERGENCY` (in-app + channels once delivery is real).
- Approval queue: `PENDING_APPROVAL` → approve.
- Audit log viewer.

Sidebar: only for `ORG_ADMIN` (permission `COMMUNICATION_BROADCAST` / `COMMUNICATION_APPROVE`).

### 4.4 Shared client services (keep)

- `communication-api.service.ts`
- `communication-socket.service.ts`
- `new-thread-form.component.ts` (teacher + later admin)

Do not grow a third inbox. Legacy `/messages` and `/chats` stay until Phase 6.

---

## 5. Build vs buy (unchanged)

- **Buy / use:** Novu, FCM, Resend/Postmark, Twilio (SMS + later Voice), DeepL (Phase 4).
- **Build:** thread store, roster derivation, reply-only + permission guards, urgency/quiet-hours policy, audit log, migration off legacy.

Until Novu is deployed, in-app Socket.IO + `MessageDelivery` stub is the only real channel. Do not pretend push/email work in the UI.

---

## 6. Revised phase plan

### Phase 1 — Smallest usable Teacher ↔ Family (next)

Goal: a parent opening **Mensajes** on the father profile can read and reply to teacher threads. A teacher can start a class or student-guardians thread with a first message. Live in-app only.

**1A. Parent inbox (must ship)**

1. Rebuild `/parent/communication` on the real communication API (list / messages / send / mark-read / socket).
2. Reply-only UX; Spanish; empty state.
3. Point parent home recent messages at communication threads.
4. Delete `/family`, `family-chat.ts`, and the **Chat de familia** sidebar link.

**1B. Teacher + API polish (same phase)**

1. Optional `body` on create-thread; persist first message + deliveries in one transaction.
2. `class-validator` on DTOs.
3. Tighten `listThreads`: teachers see **only threads they own or participate in**. Org-admin may still see org-wide (Phase 2 console).
4. Emit `delivery:update` from `markRead`.
5. Restrict preference PATCH to self.
6. Teacher form: initial message + urgency; don’t crash on empty threads.
7. Align dashboard route guards with `COMMUNICATION_VIEW` (or keep `VIEW_MESSAGES` but document the mapping). Parents already have both.

**Out of Phase 1:** Novu, push, email, SMS, digest, PWA, admin broadcasts, emergency, translation.

Exit criteria: teacher creates a `STUDENT_GUARDIANS` thread with a body → parent sees it on `/parent/communication` without refresh (socket) → parent replies → teacher sees reply + “leído”.

### Phase 2 — Org-Admin/Staff console

- Admin UI: broadcast, approval, audit.
- `EMERGENCY` as a **policy flag** on the message (bypass quiet hours when Phase 3 exists). Until channels exist, emergency is in-app + badge only — do not claim SMS.
- Decide reply moderation (v1 left this open). Recommendation: unmoderated parent replies stay for v1; add a “mute participant” later if abused.

### Phase 3 — Delivery hardening

- Deploy self-hosted Novu; implement `dispatchToNovu` only (seam already documented).
- Public HMAC webhook; reconcile `MessageDelivery`.
- Channel prefs + quiet hours + timezone at fan-out. Emergency bypasses quiet hours.
- ROUTINE digest via Novu.
- FCM push + email provider. SMS (Twilio) as fallback for IMPORTANT/EMERGENCY.
- Consent capture **before** enabling SMS (TCPA-style). Blocked on legal.
- Service worker + VAPID in `web-dashboard` (not a new PWA app). Offline outbox flush on `online`.
- Socket.IO Redis adapter before multi-instance.

### Phase 4 — Translation (deferred)

Plug DeepL into `TranslationService`; store original body; per-recipient `language`.

### Phase 5 — Emergency voice (deferred)

Twilio Voice TTS for `EMERGENCY`; `VOICE` channel + consent.

### Phase 6 — Migration & decommission

- Point remaining `/messages` / `/chats` UI (admin/teacher/student home widgets, unread badge) at communication or freeze them.
- Backfill or archive legacy `Chat` / `Message` / `Notification`.
- Remove `apps/dashboard-backend/src/app/chats/` and the old messages module.
- Remove `web-admin` mock communication pages if that app still ships them.

---

## 7. Decisions locked in review (2026-09-17)

| Question | Decision |
|---|---|
| Student inbox in Phase 1? | **Parents only.** No student messages screen. |
| Can a parent start a thread? | **Reply-only.** Remove the mock “Enviar mensaje” button. No compose flow. |
| Teacher thread visibility | **Only threads they own or participate in.** Not all org threads. |
| Wait on Novu? | **No.** Phase 1 is in-app only. |
| `/parent/notifications` (Alertas) | **Leave as-is** (mock attendance/grades). Do not fold communication unread into it. |

Also locked earlier: no `web-family`; father profile `/parent/communication` is the parent client; REST not GraphQL; broadcast/approve via permissions.

Deferred (not blocking Phase 1):

- Quiet hours timezone defaults to UTC until collected.
- Phase 6 cutover: freeze legacy inbox unless a school is already using `/messages` in production (revisit then).

Compliance (carry forward): SMS/push to parents of minors needs consent; multi-tenant isolation on every query and Novu subscriber (`userId`+`organizationId`); webhook upserts idempotent on `novuEventId`; cost model before SMS/translation rollout.

---

## 8. Next implementation order

1. ~~Phase 1A: parent inbox on `/parent/communication` + delete `/family`.~~
2. ~~Phase 1B: teacher/API polish.~~
3. ~~Phase 2: admin broadcast console.~~
4. Phase 3 remaining: deploy Novu, implement `dispatchToNovu`, FCM + email, service worker/VAPID, Socket.IO Redis adapter.
5. Phase 4–6 unchanged (translation, voice, legacy decommission).
