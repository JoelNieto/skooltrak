# School Communication Platform — Implementation Plan

> Status: design reviewed, not yet implemented. Derived from the existing Skooltrak
> monorepo (`prisma/schema.prisma`, `apps/dashboard-backend/src/app/chats/`,
> `apps/web-dashboard`, `apps/web-admin`).

## 0. Context & decisions locked

This is **not** greenfield infrastructure — the repo already runs the exact stack we
need. The work is a **clean rebuild of the communication domain** on top of it.

Locked decisions (from planning interview):
1. **Full replace + migrate** — delete the legacy `Chat` / `ChatMessage` / `ChatParticipant`
   (Socket.IO) and `Message` / `MessageRecipient` / `Notification` models and rebuild on a
   new unified `communication` schema. Single message store; every client reads/writes
   through it.
2. **Clients = 2 user-facing apps for the comms platform.** `web-dashboard` is role-scoped and
   hosts **both** the Teacher workspace **and** the Org-Admin/Staff console (broadcast approval,
   audit). A **new `web-family` Angular PWA** serves parents/students. `web-admin` is the
   *platform* admin app only and is **out of scope** for this communication platform — school staff
   and organization admins already live in `web-dashboard` (`apps/web-dashboard/src/app/admin/...`).
   All reuse `libs/ui`, `libs/client-auth`, Tailwind + DaisyUI. Native mobile can follow later via
   Capacitor.
3. **Delivery engine = Novu (self-hosted OSS)** for channel fan-out (in-app/push/email/SMS),
   subscriber channel preferences, digest batching, and per-recipient/per-channel read receipts.
   Our Prisma DB stays the single source of truth for threads/messages; Novu only delivers copies.
4. **Emergency voice call = deferred** (Phase 5). Phase 1–4 Emergency = push + SMS + email.
5. **Translation = deferred** (Phase 4) but designed with a seam now: per-recipient language
   preference + a `TranslationService` interface to plug DeepL into later. No translation tables
   in v1.

### Stack (recommended — i.e. keep what exists, add 2 services)
- **Frontend:** Angular 21 (SSR) + Tailwind 4 + DaisyUI. `web-dashboard` already serves Teacher
  and Org-Admin/Staff roles (see `apps/web-dashboard/src/app/admin/`). New `web-family` PWA with a
  service worker for offline outgoing-queue + web-push. Reasoning: 100% reuse of existing component
  libraries, auth interceptor, and deployment pipeline; PWAs give installable app + web-push
  without a second mobile stack. `web-admin` (platform) is intentionally excluded.
- **Backend:** NestJS 11 (existing). New `apps/dashboard-backend/src/app/communication/` module.
  Reuse better-auth `Member`/role guards and the `Role`/`Permission` tables for permissions.
- **DB:** PostgreSQL + Prisma 7 (existing). The `communication` models below replace the legacy
  chat/message/notification models.
- **Real-time:** Socket.IO (existing `chat-socket.gateway.ts` pattern) for in-app live delivery,
  typing indicators, and delivery-status pushes. Scale later with the Redis adapter.
- **Delivery orchestration:** Novu self-hosted. Subscribers keyed by `userId`+`organizationId`.
- **Channel providers (through Novu):** FCM (push), Resend or Postmark (email), Twilio (SMS +
  later Voice). DeepL (translation, Phase 4).

## 1. Data model (Prisma — replaces legacy chat/message/notification)

Reuses: `User`, `Role`, `Permission`, `Member`, `Organization`, `School`, `Course`,
`ClassGroup`, `Student`, `Parent`, `Teacher`.

```prisma
enum ThreadType { CLASS_GROUP COURSE STUDENT_GUARDIANS SCHOOL_WIDE DIRECT }
enum ThreadStatus { ACTIVE ARCHIVED PENDING_APPROVAL APPROVED }
enum UrgencyTier { ROUTINE IMPORTANT EMERGENCY }
enum DeliveryChannel { IN_APP PUSH EMAIL SMS VOICE }
enum DeliveryStatus { PENDING SENT DELIVERED READ FAILED BOUNCED }

model CommunicationThread {
  id            String       @id @default(cuid())
  organizationId String
  type          ThreadType
  scopeId       String?      // courseId | classGroupId | schoolId | studentId depending on type
  title         String
  createdById   String       // User id of owner (teacher or admin)
  ownerRole     String       // TEACHER | ORG_ADMIN  (parents never owners)
  urgencyDefault UrgencyTier @default(ROUTINE)
  status        ThreadStatus @default(ACTIVE)
  approvedById  String?
  approvedAt    DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?
  participants  ThreadParticipant[]
  messages      Message[]
  @@index([organizationId])
  @@index([scopeId])
  @@map("communication_threads")
}

model ThreadParticipant {
  id         String   @id @default(cuid())
  threadId   String
  userId     String   // recipient User (parent/student/teacher/admin)
  role       String   @default("MEMBER") // OWNER | MEMBER
  canInitiate Boolean @default(false)    // false for parents (reply-only)
  addedById  String?
  joinedAt   DateTime @default(now())
  lastReadAt DateTime?
  @@unique([threadId, userId])
  @@index([userId])
  @@map("thread_participants")
}

model Message {
  id         String      @id @default(cuid())
  threadId   String
  senderId   String      // User id
  body       String      // original-language body (v1)
  urgency    UrgencyTier @default(ROUTINE)
  createdAt  DateTime    @default(now())
  editedAt   DateTime?
  deletedAt  DateTime?
  deliveries MessageDelivery[]
  @@index([threadId])
  @@map("messages")
}

// per-recipient, per-channel receipt — the read-receipt source of truth mirror
model MessageDelivery {
  id              String        @id @default(cuid())
  messageId       String
  recipientUserId String
  channel         DeliveryChannel
  status          DeliveryStatus @default(PENDING)
  novuEventId     String?       // links to Novu notification for webhook reconciliation
  deliveredAt     DateTime?
  readAt          DateTime?
  failureReason   String?
  @@unique([messageId, recipientUserId, channel])
  @@index([recipientUserId])
  @@map("message_deliveries")
}

model RecipientPreference {
  userId        String   @id
  language      String?  // deferred translation; null = org default
  timezone      String   @default("UTC")
  quietHoursStart String? // "21:00"
  quietHoursEnd   String? // "07:00"
  channelPrefs  Json?    // { push:true, email:true, sms:false }
  novuSubscriberId String?
  @@map("recipient_preferences")
}

model CommunicationAuditLog {
  id             String   @id @default(cuid())
  actorId        String?
  organizationId String?
  action         String   // THREAD_CREATED, MESSAGE_SENT, BROADCAST_APPROVED, PARTICIPANT_ADDED, ...
  threadId       String?
  messageId      String?
  detail         String?
  ip             String?
  createdAt      DateTime @default(now())
  @@index([organizationId])
  @@index([action])
  @@map("communication_audit_logs")
}
```
Notes:
- Recipients for a `CLASS_GROUP` thread = all `Student`s in the group + their `Parent`s
  (`Parent.students`). A `STUDENT_GUARDIANS` thread = one student's parents. Derived in the
  service, then materialized as `ThreadParticipant` rows so delivery/receipts are explicit.
- Legacy `Notification` is dropped; in-app delivery becomes `IN_APP` rows in `MessageDelivery`.
- Keep `chat-retention.service.ts` concept as `communication-retention` (minor-data retention /
  right-to-erasure).

## 2. API surface (NestJS controllers + Socket.IO gateway)

**Message routing / threads**
- `POST   /communication/threads` — create (permission-checked by `ownerRole`/scope)
- `GET    /communication/threads` — list threads visible to caller (scoped)
- `GET    /communication/threads/:id`
- `POST   /communication/threads/:id/messages` — send with `urgency` tier
- `POST   /communication/threads/:id/messages/:mid/reply` — parent/student reply (initiate=false)
- `GET    /communication/threads/:id/messages`
- `PATCH  /communication/messages/:id/read` — mark read (updates `MessageDelivery.readAt`)
- `WS     thread:message.new`, `thread:typing`, `delivery:update` (Socket.IO)

**Roster & permissions**
- `GET  /communication/roster/class-group/:id/recipients` (teacher/admin)
- `GET  /communication/roster/student/:id/guardians`
- `POST /communication/threads/:id/participants` — teacher/admin add; **parents blocked** by guard

**Delivery fallback (via Novu)**
- `POST /communication/subscribers/sync` — upsert Novu subscriber + channel prefs
- `POST /communication/delivery/preview` — which channels a message would hit (dry run)
- `GET  /communication/messages/:id/deliveries` — per-recipient/per-channel receipts
- `POST /communication/webhooks/novu` — Novu webhook → reconcile `MessageDelivery` (SENT/DELIVERED/READ/FAILED)

**Translation (Phase 4 seam only)**
- `PATCH /communication/recipients/:id/preference` (set `language`) — stubbed now
- `TranslationService.translate()` interface, no-op until DeepL wired

**Org-Admin/Staff console (lives in `web-dashboard`, not `web-admin`)**
- `POST /communication/broadcasts` — school/class broadcast; `status=PENDING_APPROVAL` if policy requires
- `POST /communication/broadcasts/:id/approve` — second-admin approval → `APPROVED` → fan-out
- `GET  /communication/admin/audit` — `CommunicationAuditLog` view

## 3. Build vs buy (summary)
- **Buy / use:** Novu (orchestration + digests + prefs + receipts), FCM (push), Resend/Postmark
  (email), Twilio (SMS + later Voice), DeepL (translation, deferred). Reasoning: these are
  commodity, regulated, and expensive to get right (telephony consent, deliverability, digests).
- **Build in-house:** thread/participant store (Prisma source of truth), roster derivation,
  permission/reply-only guards, urgency-tier evaluation + quiet-hours logic, audit log, migration
  off legacy modules. Reasoning: this is the product IP and must be multi-tenant-safe and auditable.

## 4. Phase plan (smallest usable first)

- **Phase 0 — Foundations:** new `communication` NestJS module + Prisma models (replace legacy
  chat/message/notification); Novu self-hosted deployed; Socket.IO gateway; `RecipientPreference`
  + subscriber sync; shared `libs/ui` thread components. No UI clients yet.
- **Phase 1 — Smallest usable (Teacher ↔ Family):** `web-dashboard` teacher workspace +
  new `web-family` PWA. Teacher creates `CLASS_GROUP` / `STUDENT_GUARDIANS` threads. Tiers
  `ROUTINE` + `IMPORTANT` only. Delivery = in-app (Socket.IO) + push (FCM via Novu) + email
  fallback; `ROUTINE` batched into digest. Per-recipient read receipts via Novu webhooks.
  Parents/students **reply-only** (cannot start threads / add participants). No admin, no
  emergency, no translation.
- **Phase 2 — Org-Admin/Staff console (inside `web-dashboard`):** org-admin/staff broadcast to
  class/school, approval workflow (`PENDING_APPROVAL` → `APPROVED`), audit visibility
  (`CommunicationAuditLog`), Emergency tier (push + SMS + email, **bypass quiet hours**). This is
  the "Admin console" surface — it lives in `web-dashboard`, not `web-admin` (platform).
- **Phase 3 — Delivery hardening:** SMS fallback (Twilio) through Novu; per-recipient channel
  preferences + quiet-hours enforcement; PWA offline outgoing-queue + web-push; Socket.IO Redis
  adapter for scale.
- **Phase 4 — Translation (deferred):** plug DeepL via `TranslationService`; per-recipient
  `language`; store original + translated bodies; translate both directions.
- **Phase 5 — Emergency voice (deferred):** Twilio Voice TTS reading the message body for
  `EMERGENCY`; adds `VOICE` channel + consent handling.
- **Phase 6 — Migration & decommission:** backfill/archive legacy `Chat`/`Message`/`Notification`
  history into the new model (or freeze read-only); remove legacy modules; cut over.

## 5. Risks & open questions (carry into build)
- **Compliance:** SMS/push to parents of minors needs explicit consent (TCPA-style) + student-data
  privacy (FERPA/GDPR). Capture consent before enabling SMS. Confirm with legal before Phase 2/3.
- **Multi-tenant isolation:** every query and Novu subscriber must be scoped by `organizationId`;
  verify Novu env-per-org or subscriber-scoping strategy.
- **Receipt reconciliation:** Novu is the delivery signal but our DB is the audit source of truth —
  define the webhook reconciliation contract (idempotent upserts on `novuEventId`).
- **Reply moderation:** parent replies are unmoderated in v1 — abuse vector; decide if teachers/admin
  need to moderate before Phase 2.
- **Quiet-hours + timezone:** correctness of "bypass for emergency" depends on accurate per-recipient
  `timezone`; default to UTC until populated.
- **Student vs parent identity:** a `Student` may also be a `User` — confirm whether students get
  their own `web-family` login or only view via parent.
- **"Staff" role = `ORG_ADMIN` for now:** school staff is currently only the `ORG_ADMIN` role in
  `web-dashboard`; more staff roles will be added later. **Design the broadcast/approval guards on
  *permissions* (e.g. `communication.broadcast`, `communication.approve`) rather than a hardcoded
  role check**, so future staff roles slot in without code changes. This is resolved, not an open
  question.
- **Migration cutover:** decide backfill vs freeze-legacy; coordinate with Phase 6 to avoid double
  delivery during transition.
- **Cost at scale:** SMS + (deferred) translation + push per message per recipient — model per-school
  cost before broad rollout.
- **Real-time scale:** Socket.IO single instance OK for pilot; plan Redis adapter before multi-school.
