# COM-002 — Broadcasts (comunicados)

| | |
|---|---|
| **Status** | Shipped (as-is, reverse-engineered from code on 2026-11-13) |
| **Context** | COM — Communication (see [capabilities](../capabilities.md#com-communication)) |
| **Owner** | — |
| **Last updated** | 2026-11-13 |
| **Related** | `.kilo/plans/school-communication-platform-v2.md` · commit `758e28d` · `apps/dashboard-backend/src/app/communication/` · `apps/web-dashboard/src/app/communication/broadcasts.ts`, `recent-broadcasts.ts` |

## 1. Problem & outcome
Schools need to send one announcement (an *aviso* or *comunicado*) to a whole class, course or school. It has to reach students and their families, and it must not get lost among one-to-one conversations. School-wide announcements carry institutional weight, so they need a second pair of eyes before going out.

**Success metric:** <not yet defined — proposal: % of broadcasts read by ≥ 1 guardian per student within 24 h>

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| Teacher | Create class-group / course broadcasts (auto-approved). Create school-wide broadcasts (needs approval). List and update **own** broadcasts. | `COMMUNICATION_BROADCAST` | Own courses + groups related to them (BR-COM-002.7) |
| School admin | Everything a teacher can, plus list **all** broadcasts in the org, approve pending ones, update any, view audit. | `COMMUNICATION_BROADCAST`, `COMMUNICATION_APPROVE` | Organization |
| Student, parent | Receive and read broadcasts. Reply only when replies are allowed. | `COMMUNICATION_VIEW` | Threads where they are a participant |

## 3. Functional requirements
- **FR-COM-002.1**: Staff can create a broadcast with a title, a body, an audience type (`CLASS_GROUP`, `COURSE`, `SCHOOL_WIDE`) with its scope id, an urgency (`ROUTINE` · `IMPORTANT` · `EMERGENCY`) and a *replies allowed* flag (default on).
- **FR-COM-002.2**: When created, the audience becomes a fixed list of thread participants: the creator as `OWNER`, and every recipient as `MEMBER` who cannot start new threads.
  - Class group / course: its students and their parents.
  - School-wide: all students of the school, their parents, and teachers.
- **FR-COM-002.3**: An approved broadcast is delivered right away. A delivery record is created for each recipient, it goes through the delivery channel, and a real-time `message:new` event is emitted.
- **FR-COM-002.4**: An approver can approve a pending broadcast. It is then stamped with the approver and time, and delivered as in .3.
- **FR-COM-002.5**: The owner or a school admin can switch *replies allowed* on or off after sending. Recipients see the change in real time (`thread:updated`).
- **FR-COM-002.6**: Every role's home page shows the latest approved broadcasts the user participates in: 5 by default, at most 20. School admins see every broadcast in the org.
- **FR-COM-002.7**: Staff can list broadcasts filtered by status. Teachers see only their own; school admins see all (latest 100).
- **FR-COM-002.8**: Create, approve and update actions are written to the communication audit log, and school admins can view it.

## 4. Business rules
- **BR-COM-002.1**: A broadcast needs approval (`PENDING_APPROVAL`) if the creator isn't staff (`TEACHER`, `ORG_ADMIN`, `ADMIN`, `SYSADMIN`), **or** if the audience is `SCHOOL_WIDE`. Otherwise it is `APPROVED` straight away.
- **BR-COM-002.2**: Only the creator and admins can see a pending broadcast. Nobody can post in it until it is approved (`403 Broadcast thread is not approved for messaging`).
- **BR-COM-002.3**: When replies are off, only the owner and school admins can post. Anyone else gets `403 Replies are disabled on this broadcast`.
- **BR-COM-002.4**: Only `PENDING_APPROVAL` broadcasts can be approved (`400` otherwise).
- **BR-COM-002.5**: `CLASS_GROUP`, `COURSE` and `SCHOOL_WIDE` all require a `scopeId` (`400`).
- **BR-COM-002.6**: Parents never own threads. They are reply-only participants (platform rule from the v2 plan).
- **BR-COM-002.7** *(built in [S04](../slices/COM-002-S04-teacher-audience-scope.md), in review)*: A teacher can only target their own courses, and class groups related to those courses (groups whose study plan contains a course the teacher teaches). Homeroom alone doesn't count. Admins are unrestricted. Violations get `403`.

## 5. Data
- `CommunicationThread` with `broadcast = true`, `type`, `scopeId`, `status`, `repliesAllowed`, `urgencyDefault`, `approvedById` / `approvedAt`, `ownerRole`.
- `ThreadParticipant` (`OWNER` / `MEMBER`, `canInitiate`), `CommunicationMessage`, `MessageDelivery`, `CommunicationAuditLog`.
- Tenancy: every query filters on the caller's `organizationId`. Recipients are resolved inside the caller's organization.

## 6. API surface
| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `POST /api/v1/communication/broadcasts` | Create | `COMMUNICATION_BROADCAST` | .1 .2 .3 |
| `GET /api/v1/communication/broadcasts?status=` | List | `COMMUNICATION_BROADCAST` | .7 |
| `GET /api/v1/communication/broadcasts/audiences?schoolId=` | Groups/courses the caller may target (picker) | `COMMUNICATION_BROADCAST` | .1, BR .7 |
| `POST /api/v1/communication/broadcasts/:id/approve` | Approve | `COMMUNICATION_APPROVE` | .4 |
| `PATCH /api/v1/communication/broadcasts/:id` | Toggle replies | `COMMUNICATION_BROADCAST` | .5 |
| `GET /api/v1/communication/inbox/broadcasts?take=` | Home feed | `COMMUNICATION_VIEW` | .6 |
| `GET /api/v1/communication/admin/audit` | Audit log | `COMMUNICATION_APPROVE` | .8 |

Side effects: Socket.IO namespace `/communication` (`message:new`, `thread:updated`). Delivery fan-out runs through `CommunicationDeliveryService`; it is currently a **stub** that marks deliveries `SENT` until Novu is wired in.

## 7. UX
- Staff console: `web-dashboard` `/communication` (moved off `/admin` in `758e28d`).
- Home: the `RecentBroadcasts` widget on the admin, teacher, student and parent home pages.
- Thread view: the teacher and parent communication pages show broadcasts apart from regular threads, and the composer is hidden when replies are off.

## 8. Non-functional
- Recipients are minors and their guardians. Message bodies are personal data, so keep them out of logs. The audit log holds ids and counts only.
- Large schools: recipients are resolved and participants created in a single request. Consider moving that to a background job once audiences exceed a few thousand people.

## 9. Out of scope
- Scheduling a broadcast for later, editing or retracting the body after sending, attachments.
- Emergency voice calls (deferred, Phase 5) and translation (deferred, Phase 4).

## 10. Open questions
Found while reverse-engineering. Each is a candidate slice.
- [x] **Q1 — Teacher audience scope.** Teachers can broadcast to *any* class group or course in the organization; recipient resolution only checks `organizationId`. **Decided 2026-11-13:** limit them to their courses and to groups related to those courses (BR-COM-002.7). → COM-002-S04
- [ ] **Q2 — School-wide teachers.** A `SCHOOL_WIDE` broadcast for one school also reaches teachers of *every* school in the org, because the teacher query has no school filter. Is that intended? → COM-002-S05
- [ ] **Q3 — Self-approval.** A school admin can approve their own school-wide broadcast, which makes the approval step meaningless for admins. Do we need a two-person rule, or should admin-created school-wide broadcasts skip approval?
- [ ] **Q4 — Late joiners.** The audience is fixed when the broadcast is created. Students or parents who join the group later never see earlier broadcasts. Is that acceptable?
- [ ] **Q5 — Rejecting.** A pending broadcast can be approved but not rejected or withdrawn.

## 11. Slices
| Slice | Title | FRs | Status |
|---|---|---|---|
| COM-002-S01 | Staff creates group/course broadcast, recipients receive it | .1 .2 .3 | Done (pre-FRD) |
| COM-002-S02 | School-wide approval flow + audit | .4 .7 .8 | Done (pre-FRD) |
| COM-002-S03 | Optional replies + latest broadcasts on every home | .5 .6 | Done (`758e28d`) |
| [COM-002-S04](../slices/COM-002-S04-teacher-audience-scope.md) | Teachers can only broadcast to groups/courses they teach | .1, BR .7 | In review (e2e pending) |
| COM-002-S05 | School-wide audience limited to that school's teachers | .2, Q2 | Proposed |
| COM-002-S06 | Reject / withdraw a pending broadcast | Q5 | Proposed |
