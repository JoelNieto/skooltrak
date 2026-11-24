# MOB-001 — Skooltrak mobile app (parents, students, teachers)

| | |
|---|---|
| **Status** | Draft |
| **Context** | MOB — Mobile app (see [capabilities](../capabilities.md)) |
| **Owner** | TBD |
| **Last updated** | 2026-11-24 |
| **Related** | Design canvas *Skooltrak Mobile — Parent App* (claude.ai artifact `KkYEPjQKBSjG2tAmTef6kP`, 6 screens); [HOM-001](HOM-001-persona-home-dashboards.md) (home data), [ACA-001](ACA-001-course-experience.md) (courses), [COM-003](COM-003-channels-and-direct.md) (messages), [ASM-001](ASM-001-teacher-gradebook.md) |

## 1. Problem & outcome
Parents, students and teachers use Skooltrak mostly from their phones, but the only client is `web-dashboard`, a desktop-first Angular app with no install, no push and no phone navigation. Parents miss urgent things (an unexcused absence, a permission slip due Thursday) because nothing reaches them until they open a browser. Teachers can't take attendance from the classroom easily.

When this ships, each persona installs one **Skooltrak** app from the App Store / Google Play, signs in with their existing account, and gets a phone-first view of what needs them today. They are notified by push when something needs action, and can do the frequent jobs (read and reply to messages, confirm an announcement, take attendance) without the web.

The app is a new client of the **existing** `dashboard-backend` API. It adds no business logic of its own. Rules stay in the Nest services, and the same permissions and tenancy apply.

**Success metric:** 60 % of active parents have signed in on the mobile app within 60 days of launch, and the median time from an announcement that needs confirmation being published to a parent confirming it drops below 24 h.

## 2. Personas & access
The mobile app supports three personas in v1. School admins and platform admins keep using the web.

| Persona | Can (mobile) | Permission | Scope |
|---|---|---|---|
| Parent (`PARENT`) | Home per child, courses, course detail, messages, announcements (confirm), payments (read), push | `VIEW_GRADES`, `VIEW_COURSES`, `VIEW_ATTENDANCE`, `VIEW_FINANCIALS`, `COMMUNICATION_VIEW`, `COMMUNICATION_DIRECT` | Linked children (possibly across schools) |
| Student (`STUDENT`) | Home (today, work, progress), courses, course detail, channels (read), push | `VIEW_GRADES`, `VIEW_COURSES`, `VIEW_ASSIGNMENTS`, `VIEW_ATTENDANCE`, `COMMUNICATION_VIEW` | Self |
| Teacher (`TEACHER`) | Home (my day), courses, take attendance, messages and channels for own courses/groups, push | `VIEW_COURSES`, `MANAGE_ATTENDANCE`, `COMMUNICATION_VIEW`, `COMMUNICATION_CHANNELS`, `COMMUNICATION_DIRECT` | Assigned courses and class groups |
| School admin / Platform admin | See a "use the web" screen | — | — |
| Prospective user (no org / no role) | See a "finish signing up on the web" screen | — | — |

No new `Perm.*` keys are needed. Device registration (FR .22) is scoped to the caller's own user and needs authentication only.

## 3. Functional requirements

### Common: shell, session, navigation
- **FR-MOB-001.1** — Any persona can sign in with email and password, and stays signed in across app restarts until they sign out or the session expires.
- **FR-MOB-001.2** — Any persona can sign out from *Más*. Signing out removes the stored session and this device's push registration.
- **FR-MOB-001.3** — After sign-in, each persona lands on *Inicio* and sees a bottom tab bar with the tabs for their role (BR .3).
- **FR-MOB-001.4** — A school admin, platform admin or prospective user who signs in sees a screen explaining that their role uses the web, with a button that opens the web app. No other screens are reachable.
- **FR-MOB-001.5** — Any persona can reset their password from the login screen ("¿Olvidaste tu contraseña?"); the flow sends the existing reset email.
- **FR-MOB-001.6** — Any persona whose app version is below the minimum supported version sees a blocking "Actualiza Skooltrak" screen with a link to the store.
- **FR-MOB-001.7** — Any persona sees an unread count on the *Mensajes* tab and an unread dot on the notifications bell.

### Parent (designed: canvas screens 1–6)
- **FR-MOB-001.8** — A parent can switch between their linked children on *Inicio* (chips with name, group and alert count). The chosen child applies to *Inicio*, *Cursos* and *Pagos* until changed. *(Screen 1)*
- **FR-MOB-001.9** — A parent sees, for the selected child: *Requiere tu atención* (alerts), four KPI cards (period average, attendance, pending work, balance), *Mensajes recientes* and *Esta semana*. *(Screen 1)*
- **FR-MOB-001.10** — A parent can see the selected child's courses for a period (*Trimestre II / Trimestre I / Año*), with the overall average, each course's average, teacher, progress and an overdue/pending badge. *(Screen 2)*
- **FR-MOB-001.11** — A parent can open a course and see its schedule, teacher (with *Escribir*), KPIs (average, attendance, submissions), *Tareas*, *Notas* and *Asistencia* tabs, and the course channel. *(Screen 3)*
- **FR-MOB-001.12** — A parent sees one inbox, *Mensajes*, with two segments, *Conversaciones* (direct + channels) and *Tablero escolar* (announcements), filterable by *Todos / Urgente / Importante / Sin leer* and by child. *(Screen 4)*
- **FR-MOB-001.13** — A parent can read a direct conversation with a staff member and reply to it. Opening it marks it read. *(Screen 5)*
- **FR-MOB-001.14** — A parent can open an announcement, see the dated action it asks for at the top, and confirm it with the primary action pinned at the bottom. *(Screen 6)*
- **FR-MOB-001.15** — A parent can see the selected child's balance, upcoming and overdue charges, and payment history in *Pagos* (read-only). *(Not designed yet)*

### Student (not designed yet)
- **FR-MOB-001.16** — A student sees on *Inicio*: now/next class, today's schedule, upcoming and overdue work, and their period average.
- **FR-MOB-001.17** — A student can see their courses and open a course (same course screens as the parent, without the child switcher).
- **FR-MOB-001.18** — A student can read the channels they belong to.

### Teacher (not designed yet)
- **FR-MOB-001.19** — A teacher sees on *Inicio*: today's classes with their attendance state, and pending work to review.
- **FR-MOB-001.20** — A teacher can take attendance for a class from the phone: open today's class, mark each student, and save.
- **FR-MOB-001.21** — A teacher can read and reply to direct conversations with families and read their channels.

### Push notifications
- **FR-MOB-001.22** — After sign-in, the app asks for notification permission (after a short in-app explanation) and registers the device for push for the signed-in user.
- **FR-MOB-001.23** — A persona receives a push when: a staff member sends them a direct message; a channel post that requires confirmation is published to them; (parent) their child is recorded absent. Tapping it opens the related screen.
- **FR-MOB-001.24** — Any persona can turn push categories on or off in *Más › Notificaciones*.

## 4. Business rules
- **BR-MOB-001.1** — **Session.** The app signs in with `POST /v1/auth/login` and authenticates every request with `Authorization: Bearer <session token>` issued by better-auth's `bearer` plugin (Q1), so `BetterAuthGuard` resolves it as a normal better-auth session. Signing out revokes the session on the server. The token is kept only in the platform's secure store (iOS Keychain / Android Keystore), never in `localStorage` or Capacitor Preferences. On any `401`, the app deletes the token and returns to login with the toast "Tu sesión expiró. Vuelve a iniciar sesión."
- **BR-MOB-001.2** — **No mobile-only rules.** The app reads and writes only through `dashboard-backend` endpoints that enforce `@RequirePermissions` and organization + ownership scope. If a screen needs data no scoped endpoint returns, the slice adds or fixes the endpoint (with its cross-tenant test); the app never filters another tenant's data on the client.
- **BR-MOB-001.3** — **Tabs per role.** PARENT: *Inicio · Cursos · Mensajes · Pagos · Más*. STUDENT: *Inicio · Cursos · Tareas · Mensajes · Más*. TEACHER: *Inicio · Cursos · Asistencia · Mensajes · Más*. The role comes from the signed-in user. Any other role, or no organization → FR .4's screen.
- **BR-MOB-001.4** — **Selected child.** The parent's selected child defaults to the first child returned by `GET /v1/home/parent/children` (HOM-001 order) and is remembered on the device. If it is no longer linked, the app falls back to the first child. A parent with no linked children sees "Aún no tienes hijos vinculados" and a button that opens *Conectar hijo* on the web.
- **BR-MOB-001.5** — **Push payloads carry no personal data about minors.** The visible text names the sender and the kind of event only ("Nuevo mensaje de Prof. Castillo", "Dirección publicó un anuncio que requiere tu confirmación", "Nuevo registro de asistencia"). Children's names, message bodies, grades and absence details are never in the payload; they are fetched after the app opens, behind auth (Q4).
- **BR-MOB-001.6** — **Device registration.** A push token belongs to one user. Registering a token that already exists moves it to the caller. Signing out deletes it (`DELETE` returns `204` even if it was already gone). Tokens rejected by the push provider as unregistered are deleted on send. A user may only delete their own tokens; another user's token → `404`.
- **BR-MOB-001.7** — **Minimum version.** `GET /v1/app/config` (public) returns `minVersion` per platform. If the running version is lower, FR .6's screen blocks the app. If the call fails, the app continues (fail open).
- **BR-MOB-001.8** — **Confirmation is not a signature.** *Firma el permiso* in the design maps to the existing channel post confirmation (`POST /v1/communication/channels/:id/posts/:postId/confirm`). The button label is *Confirmar* (Q3). A confirmed post shows "Confirmado el {fecha}" and the button is hidden.
- **BR-MOB-001.9** — **Unexcused absence alert.** Until an absence-justification flow exists (HOM-001 Q7), the alert's action is *Escribir al docente* (opens a direct conversation with the homeroom teacher), not *Justificar* as in the design.
- **BR-MOB-001.10** — **Colour and status.** Orange (`accent`) is only for "new": unread dots and counters. Every status badge pairs a word with its colour (design note on the canvas). Tokens come from the Skooltrak design system, as in `libs/ui`; no raw palette colours.
- **BR-MOB-001.11** — **Offline.** With no connection, each screen shows its last loaded data with "Sin conexión · mostrando datos de {hora}" and every write action is disabled. Nothing is queued for later sending in v1.

## 5. Data
- New model `PushDevice`: `id`, `userId` (→ `User`, cascade), `platform` (`IOS` | `ANDROID`), `token` (unique), `appVersion`, `locale`, `lastSeenAt`, `createdAt`. Index on `userId`.
- New model `NotificationPreference` (or JSON on `User`; decide in S12): per user, per category (`DIRECT`, `CHANNEL_CONFIRMATION`, `ABSENCE`) on/off. Default on.
- No changes to existing models in v1.
- Tenancy: device rows are scoped by `userId` (self). Push fan-out resolves recipients through the existing audience and ownership logic (`channel-audience.ts`, `direct.service.ts`, parent ↔ student links), so it can't reach another organization.
- Audit: log push sends by notification id and recipient user id only, never the text (COM-003 §8).

## 6. API surface
Existing endpoints the app consumes (no changes unless a slice finds a gap):

| Method & path | Used by | Permission |
|---|---|---|
| `POST /api/v1/auth/login`, `POST /api/v1/auth/lookup-account-for-password-reset` | Login, reset | public |
| `GET /api/v1/home/parent/children`, `…/child/:studentId`, `…/child/:studentId/account` | Parent *Inicio*, *Pagos* summary | `VIEW_GRADES`, `VIEW_FINANCIALS` |
| `GET /api/v1/home/student/today · work · progress` | Student *Inicio* | `VIEW_GRADES` |
| `GET /api/v1/home/teacher/today · summary · week · attention` | Teacher *Inicio* | `VIEW_COURSES` |
| `GET /api/v1/courses/mine`, `GET /api/v1/courses/:id`, `…/:id/work`, `…/:id/grades-summary`, `…/:id/participants` | *Cursos*, course detail | `VIEW_COURSES` |
| `GET /api/v1/communication/unread · channels · channels/:id · direct · direct/:id`, `POST …/channels/:id/read`, `…/posts/:postId/confirm`, `…/direct/:id/messages` | *Mensajes* | `COMMUNICATION_*` |
| `GET /api/v1/attendance/sessions…`, `PATCH /api/v1/attendance/records/batch` | Teacher *Asistencia* | `VIEW/MANAGE_ATTENDANCE` |
| `GET /api/v1/financial/charges/by-student`, `…/payments/by-student` | *Pagos* | `VIEW_FINANCIALS` |
| `GET /api/v1/notifications`, `PATCH …/read` | Bell | auth |

New endpoints:

| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `GET /api/v1/app/config` | `minVersion` per platform, store URLs | public | .6 |
| `POST /api/v1/devices` | Register/refresh this device's push token | auth (self) | .22 |
| `DELETE /api/v1/devices/:token` | Unregister on sign-out | auth (self) | .2 |
| `GET/PUT /api/v1/notifications/preferences` | Push categories on/off | auth (self) | .24 |

Events / side effects: a `PushService` (FCM HTTP v1 for Android and, through APNs keys in Firebase, iOS) is called after a direct message is created, after a channel post with confirmation is published, and after an absence is recorded. Today notifications are created with direct `prisma.notification.create` calls in several services (`unpublished-grades-reminder.service.ts:63`, `homeroom-alerts.ts:84`, `auth.service.ts:1144`); see Q6.

CORS / auth origins: add the Capacitor origins (`capacitor://localhost` for iOS, `https://localhost` for Android) to the `CORS_ORIGINS` env (read in `main.ts:18`; the dev fallback list gets them too) and to better-auth's `TRUSTED_ORIGINS`.

## 7. UX
- **Source of truth:** the design canvas (6 parent screens at 390×844, Skooltrak design system: Geist / Space Grotesk, `surface-raised` page #F4F6FB with white cards, edge-to-edge lists, pill tab bar with 5 tabs, ≥44 px targets).
- Entry points: app launch → login → *Inicio*. Deep links `skooltrak://messages/direct/:id`, `…/channels/:id/posts/:postId`, `…/attendance/:sessionId` (also used by push taps), plus universal links on the web domain later.
- States per screen: loading (skeleton rows), empty (one line + action), error (retry), offline (BR .11), no permission (FR .4's screen).
- Native touches: pull-to-refresh on every list, iOS swipe-back, Android back button follows the nav stack, safe areas, status bar matches the surface, dynamic type up to 130 % without clipping.
- Language: Spanish (es-PA formats: `B/. 85.00`, "martes 17 de noviembre").
- Still to design: login, *Pagos*, *Más* (profile, notifications, sign out), "use the web" screen, update screen, and every student and teacher screen.

## 8. Non-functional
- **Stack:** Angular (same version as `web-dashboard`) + Capacitor 7, a new Nx app `apps/mobile` (`@nx/angular`), standalone components, signals, zoneless. Shares `libs/ui` tokens, `libs/client-auth` (bearer interceptor, adapted to async secure storage) and `libs/shared`. Plugins: `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/network`, `@capacitor/status-bar`, a secure-storage plugin.
- **Performance:** cold start to *Inicio* with data ≤ 2.5 s on a mid-range Android on 4G; JS bundle for the first route ≤ 400 kB gzipped.
- **Accessibility:** WCAG 2.2 AA contrast (tokens already pass), VoiceOver/TalkBack labels on every icon button, focus order follows reading order.
- **Privacy:** minors' data never in push payloads, logs or crash reports. Crash reporting scrubs request bodies. App Store privacy labels and Google Play data-safety form filled before release.
- **Security:** token in secure storage only; certificate validation on (no pinning in v1); no secrets in the app bundle (Firebase config files are public by design).
- **Release:** iOS 16+ and Android 8+ (API 26). Builds from CI; internal testing tracks (TestFlight, Play internal) from S02 on.

## 9. Out of scope
- School admin and platform admin features on mobile.
- Onboarding (sign-up, join school, connect child) inside the app. It opens the web.
- Paying online, the school store, files upload, creating assignments or quizzes, gradebook editing, starting channels.
- Absence justification (HOM-001 Q7), until an ATT feature exists.
- Offline writes and background sync.
- Tablet-specific layouts (the phone layout scales).
- Real-time sockets: lists refresh on open, on pull and when a push arrives.

## 10. Open questions
- [x] **Q1 — Session lifetime.** The legacy bearer JWT lasts 7 days (`auth.service.ts:141`), has no refresh and can't be revoked. **Decided 2026-11-24:** enable better-auth's `bearer` plugin. Mobile holds a better-auth session token (revocable, sliding expiry, same session table as web) and sends it as `Authorization: Bearer`. Ships in S01.
- [x] **Q2 — Design for student and teacher.** **Decided 2026-11-24:** Claude adds the missing screens to the existing design canvas with the Skooltrak design system, for review: first parent login, *Pagos* and *Más*, then teacher *Inicio/Asistencia/Mensajes*, then student *Inicio/Tareas*. S12–S16 become Ready as their screens are approved.
- [x] **Q3 — "Firma el permiso".** **Decided 2026-11-24:** the existing channel post confirmation is enough. The record is who confirmed and when (COM-003 receipt); the button reads *Confirmar* (BR .8).
- [x] **Q4 — Child name in pushes.** **Decided 2026-11-24:** generic text only ("Nuevo registro de asistencia"). No child names on the lock screen (BR .5).
- [x] **Q5 — Store accounts.** **Decided 2026-11-24:** the owner's personal Apple Developer and Google Play accounts (seller name is the person's name). They can be transferred to an organization account later; Apple app transfer keeps reviews and users.
- [ ] **Q6 — Push fan-out point.** Notifications are created in several services with direct Prisma calls. Centralise them in a `NotifyService` (in-app + push) in S11, or hook push only into the three events of FR .23? **Proposed:** a small `NotifyService` used by the three events, others migrate later.
- [ ] **Q7 — Parent courses endpoint.** Confirm which scoped endpoint returns a child's courses with averages for a parent (ACA-001-S05 built it for the web). If it is `GET /v1/courses/mine?studentId=`, reuse; otherwise S04 adds the scope.
- [ ] **Q8 — Inherited gaps.** HOM-001 Q8 (assignments by school unscoped), Q9 (attendance stats without ownership check) and Q14 (parents get 403 on `/v1/schools`) affect screens the app reuses. Fix them in the slice that first needs them, not in the app.
- [x] **Q9 — Persona order.** **Decided 2026-11-24:** parent (S03–S12) → teacher (S13–S15) → student (S16).

## 11. Slices
Ordered so the app is installable by testers after S02, and parents have a complete v1 after S12. Student and teacher slices wait on design (Q2).

| Slice | Title | FRs | Status |
|---|---|---|---|
| [MOB-001-S01](../slices/MOB-001-S01-app-shell-login.md) | App shell: `apps/mobile` (Angular + Capacitor), better-auth `bearer` plugin, login with token in secure storage, role tabs, sign-out, "use the web" screen, CORS origins | .1 .2 .3 .4, BR .1 .3 .10 | Ready |
| MOB-001-S02 | Release pipeline: CI builds and signs iOS/Android, uploads to TestFlight and Play internal; `GET /v1/app/config` + update screen | .6, BR .7 | Proposed |
| MOB-001-S03 | Parent *Inicio*: child switcher, alerts, KPI cards, *Esta semana* (HOM-001 parent endpoints) | .8 .9, BR .4 .9 | Proposed |
| MOB-001-S04 | Parent *Cursos*: period segment, overall average, course list with badges | .10 | Proposed |
| MOB-001-S05 | Course detail: header, teacher card, KPIs, *Tareas / Notas / Asistencia* tabs, course channel row | .11 | Proposed |
| MOB-001-S06 | *Mensajes* inbox: *Conversaciones / Tablero escolar*, filters, unread counts on tab and *Mensajes recientes* | .7 .12 | Proposed |
| MOB-001-S07 | Direct conversation: read, reply, mark read | .13 | Proposed |
| MOB-001-S08 | Announcement: read, dated action, pinned *Confirmar* | .14, BR .8 | Proposed |
| MOB-001-S09 | Offline snapshot and error/empty states across parent screens | BR .11 | Proposed |
| MOB-001-S10 | Push foundation: `PushDevice` model, `POST/DELETE /v1/devices`, permission prompt, FCM/APNs setup, push on direct message, tap → conversation | .22 .23 (direct), BR .5 .6 | Proposed |
| MOB-001-S11 | Push for announcements needing confirmation and for absences; `NotifyService` | .23, BR .5 | Proposed |
| MOB-001-S12 | *Más* (profile, notification preferences, sign out), password reset, *Pagos* (read-only) | .5 .15 .24 | Proposed (needs design) |
| MOB-001-S13 | Teacher *Inicio*: today's classes with attendance state, pending to review | .19 | Proposed (needs design) |
| MOB-001-S14 | Teacher *Asistencia*: take attendance for today's class, batch save | .20 | Proposed (needs design) |
| MOB-001-S15 | Teacher *Mensajes*: reply to families, read channels (reuses S06–S07) | .21 | Proposed (needs design) |
| MOB-001-S16 | Student *Inicio*, *Cursos*, *Tareas* and channels (reuses S04–S06) | .16 .17 .18 | Proposed (needs design) |
| MOB-001-S17 | Store release: privacy labels, data-safety form, listings, production rollout | — | Proposed |
