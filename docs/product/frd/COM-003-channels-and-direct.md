# COM-003 — Channels and direct messages

| | |
|---|---|
| **Status** | In build |
| **Context** | COM — Communication (see [capabilities](../capabilities.md#com-communication)) |
| **Owner** | — |
| **Last updated** | 2026-11-25 |
| **Related** | Replaces [COM-002](COM-002-broadcasts.md) (broadcasts), the v2 communication threads, legacy chats, legacy messages and newsletters · `apps/dashboard-backend/src/app/communication/` · `apps/web-dashboard/src/app/communication/` |

## 1. Problem & outcome
The platform had five overlapping ways to communicate: mail-style messages, chats, v2 threads, broadcasts and newsletters. Staff didn't know which to use, families had to check several inboxes, and read tracking differed between them.

From now on there are exactly **two** ways to communicate:

1. **Channels (Canales)**: one-to-many. Staff or teachers post to an audience defined by a level of the school (organization, school, study plan, class group or course). Students and/or parents read, and reply if the channel allows it. Whoever manages the channel sees how many people read each post. A post can also ask for an explicit read confirmation.
2. **Direct messages (Mensajes directos)**: one-to-one between a member of staff or a teacher and a parent. Only staff and teachers can start one; the parent replies. Students never see them.

Everything else is removed.

**Success metric:** % of channel posts that ask for a confirmation and are confirmed by ≥ 1 guardian per student within 48 h.

## 2. Personas & access
| Persona | Can | Permission | Scope |
|---|---|---|---|
| School admin | Create and manage channels at any level. Post, see read counts and receipts. Start direct conversations with any parent. | `COMMUNICATION_CHANNELS`, `COMMUNICATION_DIRECT` | Organization |
| Teacher | Create and manage channels for the courses they teach and the class groups related to those courses (BR .2). Start direct conversations with parents of students in those courses or groups. | `COMMUNICATION_CHANNELS`, `COMMUNICATION_DIRECT` | Own courses and related groups |
| Student | Read the channels whose audience includes students. Reply if students may reply. Confirm reading. | `COMMUNICATION_VIEW` | Own school, plan, group, courses |
| Parent | Read the channels whose audience includes parents, for each linked child. Reply if parents may reply. Confirm reading. Read and reply to direct conversations started with them. | `COMMUNICATION_VIEW`, `COMMUNICATION_DIRECT` | Linked children (across organizations) |

## 3. Functional requirements

### Channels
- **FR-COM-003.1**: Staff can create a channel with a name, an optional description, a **level** (`ORGANIZATION`, `SCHOOL`, `STUDY_PLAN`, `CLASS_GROUP`, `COURSE`) and the matching school / plan / group / course.
- **FR-COM-003.2**: The channel sets its **audience**: students, parents, or both (at least one).
- **FR-COM-003.3**: The channel sets **who may reply**: students yes/no, parents yes/no (only for audiences it includes). Both off means the channel is announcement-only.
- **FR-COM-003.4**: The channel sets **reply visibility**: `PUBLIC` (every member sees every reply) or `PRIVATE` (each member's replies form a private conversation with the channel's managers; other members never see them).
- **FR-COM-003.5**: Managers can change the name, description, reply settings and visibility, and archive a channel. Level and target cannot change after creation. An archived channel stays readable and accepts no new posts or replies.
- **FR-COM-003.6**: A manager can publish a post (text). The post may be marked **"Requiere confirmación de lectura"**.
- **FR-COM-003.7**: Membership is **live**: anyone who is in the audience now sees the channel and all its posts, including posts from before they joined.
- **FR-COM-003.8**: A member opening a channel marks its posts as read. On a post that requires confirmation, the member presses **Confirmar lectura**; the confirmation is stored with its time and can't be undone.
- **FR-COM-003.9**: For each post, managers see **read count / audience size** and, when confirmation is required, **confirmed count / audience size**. They can open the list of members with the time each one read and confirmed.
- **FR-COM-003.10**: Members and managers see replies according to BR .5. In a `PRIVATE` channel a manager sees one conversation per member who replied and can answer inside it.
- **FR-COM-003.11**: Everyone gets a channels list with an unread count per channel. Staff get the channels they manage; members get the channels they belong to.

### Direct messages
- **FR-COM-003.12**: Staff can start a direct conversation with a parent, optionally about one of their children. Starting again with the same parent and child reopens the existing conversation.
- **FR-COM-003.13**: Both sides can send messages in the conversation. Each side sees when the other read it (**Leído**).
- **FR-COM-003.14**: Staff and parents get a direct inbox with an unread count per conversation.

### Both
- **FR-COM-003.15**: The sidebar shows the unread count for channels and for direct messages.
- **FR-COM-003.16**: Home pages show the latest channel posts (every role), the teacher's direct conversations waiting for an answer, and each child's direct conversations on the parent home.

### Assignment Q&A channels *(decided 2026-11-25, from ACA-001 Q10)*
- **FR-COM-003.17**: Creating an assignment creates its **Q&A channel**, at the new level `ASSIGNMENT`. It is named after the assignment, its audience is students only, students may reply, and replies are public. It opens with a pinned post by the assignment's teacher: *"Preguntas sobre «{título}». Pregunten aquí; todos ven las respuestas."* Students ask by replying under it (FR .10); only managers post, as for every channel (BR .1, .3).
- **FR-COM-003.18**: The Q&A channel **closes** 3 days after the assignment's latest due date across its class groups (BR .11). A closed channel behaves like an archived one: it stays readable and accepts no posts or replies (FR .5). Changing the assignment's dates moves the close time. Managers can still archive it earlier, or change its reply settings and visibility (FR .5).
- **FR-COM-003.19**: Managers see, per channel, how many replies are **por responder** (BR .12): on `GET channels`, and as *"{n} por responder"* in the channels list.

## 4. Business rules
- **BR-COM-003.1**: Only staff create channels and start direct conversations. Parents and students never can (`403`).
- **BR-COM-003.2**: A teacher can only create or manage a `COURSE` channel for a course they teach, or a `CLASS_GROUP` channel for a group related to one of their courses (the group's study plan contains a course they teach; homeroom alone doesn't count, same as BR-COM-002.7). `ORGANIZATION`, `SCHOOL` and `STUDY_PLAN` channels are for school admins only (`403`).
- **BR-COM-003.3**: A channel's **managers** are the people who could create it: school admins of its organization for every channel, and teachers per BR .2. Only managers post, see read counts and receipts, and edit or archive the channel.
- **BR-COM-003.4**: The audience of a channel is the people who have an account and are active students, or parents of active students, at the channel's level:
  - organization: every active student of the organization;
  - school: active students of that school;
  - study plan: active students whose class group is in that plan;
  - class group: active students of that group;
  - course: active students on the course roster (ACA-001 BR .15).
- **BR-COM-003.5**: Reply visibility. A member can reply only if their audience type may reply and the channel isn't archived (`403`).
  - `PUBLIC`: every member and manager sees every reply.
  - `PRIVATE`: a member sees only their own conversation (their replies plus the managers' answers to them). Managers see every conversation.
- **BR-COM-003.6**: Read confirmations only exist on posts that require them (`400` otherwise). Confirming also marks the post read.
- **BR-COM-003.7**: Direct messages are only between staff and parents. A student, or a user with the student role, gets `403` on every direct endpoint, even if their role was granted the permission.
- **BR-COM-003.8**: Admins can message any parent of their organization. Teachers can only message parents of students who are on the roster of one of their courses or in a group related to them (`403`). When a child is chosen, the parent must be linked to that child (`400`).
- **BR-COM-003.9**: Only the two participants can see a direct conversation (`404` for anyone else, so its existence isn't revealed).
- **BR-COM-003.10**: **Assignment channel audience.** Active students on the course roster (ACA-001 BR .15) whose class group has a date for the assignment (`AssignmentDate`). Its managers are those of a `COURSE` channel of the assignment's course (BR .2, .3). An `ASSIGNMENT` channel is only ever created with its assignment (`400` on `POST channels`), its assignment can't change, and it is deleted with the assignment. An assignment has at most one.
- **BR-COM-003.11**: **Closing.** `closesAt` = the latest `AssignmentDate.date` + 3 days, recomputed whenever the assignment's dates change; an assignment with no dates has no `closesAt` (never closes). A channel is closed when it is archived or `closesAt` has passed. Every rule that refuses posts or replies on an archived channel refuses them on a closed one (`403` with the same message), and the channel is listed as archived.
- **BR-COM-003.12**: **Por responder** *(decided 2026-11-25, ACA-001 Q11)*, counted for managers only (members get `0`), on open channels:
  - `PRIVATE`: each member conversation whose latest reply is from the member;
  - `PUBLIC`: each member reply newer than the latest manager reply in that post's thread (or than the post, with no manager reply).

  Any manager's reply answers it, not only the post's author.

## 5. Data
- `Channel` (`scope`, `schoolId` / `studyPlanId` / `classGroupId` / `courseId`, `audienceStudents`, `audienceParents`, `studentsCanReply`, `parentsCanReply`, `replyVisibility`, `archivedAt`, `createdById`).
- `ChannelPost` (`body`, `requiresConfirmation`, `authorId`, soft delete).
- `ChannelReply` (`postId`, `authorId`, `body`, `threadUserId`: in `PRIVATE` channels the member whose conversation it belongs to; `null` in `PUBLIC`).
- `ChannelPostRead` (`postId`, `userId`, `readAt`, `confirmedAt`): one row per member per post.
- *(S02)* `ChannelScope` gains `ASSIGNMENT`; `Channel` gains `assignmentId String? @unique` (cascade on delete) and `closesAt DateTime?`; `ChannelPost` gains `pinned Boolean @default(false)` for the opening post.
- `DirectConversation` (`staffUserId`, `parentUserId`, optional `studentId`, `staffLastReadAt`, `parentLastReadAt`, `lastMessageAt`) and `DirectMessage`.
- Removed: `Message`, `MessageRecipient`, `Chat*`, `CommunicationThread`, `ThreadParticipant`, `CommunicationMessage`, `MessageDelivery`, `RecipientPreference`, `CommunicationAuditLog`, `Newsletter`. Existing data in them is dropped.
- Tenancy: channels and conversations belong to one organization. Staff only see their own organization. Parents see the channels and conversations of every organization where they have a linked child.

## 6. API surface
All under `/api/v1/communication`.

| Method & path | Purpose | Permission | FRs |
|---|---|---|---|
| `GET channels` | Channels I manage or belong to, with unread counts | `COMMUNICATION_VIEW` | .11 |
| `GET channels/targets?scope=&schoolId=` | Schools, plans, groups and courses I may target | `COMMUNICATION_CHANNELS` | .1, BR .2 |
| `POST channels` | Create | `COMMUNICATION_CHANNELS` | .1–.4 |
| `GET channels/:id` | Channel with posts (and stats for managers) | `COMMUNICATION_VIEW` | .7 .9 |
| `PATCH channels/:id` | Edit settings / archive | `COMMUNICATION_CHANNELS` | .5 |
| `POST channels/:id/posts` | Publish a post | `COMMUNICATION_CHANNELS` | .6 |
| `DELETE channels/:id/posts/:postId` | Delete a post | `COMMUNICATION_CHANNELS` | .5 |
| `POST channels/:id/read` | Mark the channel's posts read | `COMMUNICATION_VIEW` | .8 |
| `POST channels/:id/posts/:postId/confirm` | Confirm reading | `COMMUNICATION_VIEW` | .8 |
| `GET channels/:id/posts/:postId/receipts` | Who read / confirmed | `COMMUNICATION_CHANNELS` | .9 |
| `GET channels/:id/posts/:postId/replies?member=` | Replies I may see | `COMMUNICATION_VIEW` | .10 |
| `POST channels/:id/posts/:postId/replies` | Reply (`threadUserId` for managers in private channels) | `COMMUNICATION_VIEW` | .10 |
| `GET channels/recent?take=` | Latest posts for home | `COMMUNICATION_VIEW` | .16 |
| `GET direct` | My conversations | `COMMUNICATION_DIRECT` | .14 |
| `GET direct/recipients?q=` | Parents I may message, by student | `COMMUNICATION_DIRECT` | .12 |
| `POST direct` | Start or reopen | `COMMUNICATION_DIRECT` | .12 |
| `GET direct/:id` | Conversation with messages (marks read) | `COMMUNICATION_DIRECT` | .13 |
| `POST direct/:id/messages` | Send | `COMMUNICATION_DIRECT` | .13 |
| `GET unread` | `{ channels, direct }` for the sidebar | `COMMUNICATION_VIEW` | .15 |

Removed endpoints: `/v1/messages/*`, `/v1/chats/*`, `/v1/newsletters/*`, and every previous `/v1/communication/*` path (threads, broadcasts, deliveries, subscribers, preferences, Novu webhook, audit). The Socket.IO namespaces `/chats` and `/communication` are gone; the UI polls.

## 7. UX
- Sidebar: **Canales** (`/communication/channels`) for everyone; **Mensajes directos** (`/communication/direct`) for staff and parents. Both with unread badges.
- Channel page: posts newest first. Managers see "Leído por 12 de 30" and "Confirmado por 8 de 30" with a link to the receipts list, and a composer with the confirmation toggle. Members see a **Confirmar lectura** button on posts that need it. Replies open under each post.
- Course and class-group pages: a **Canal** button for managers opens the existing channel for it or the create form already set to that level.
- States: empty, loading, error, archived (read-only banner).

## 8. Non-functional
- Message bodies are personal data about minors: keep them out of logs.
- Audience is computed per request. Read counts use one grouped query per page of posts.

## 9. Out of scope
- Attachments, scheduling posts, editing a post after publishing.
- Email/push delivery and quiet hours (the old stub was removed with the v2 threads). Real-time updates (the UI polls).
- Admin oversight of other people's direct conversations.
- Teachers as a channel audience (staff-to-staff channels).

## 10. Open questions
- [ ] Should admins be able to read teachers' direct conversations for safeguarding?
- [ ] Do we need email/push for posts that require confirmation?
- [x] **Assignment Q&A channels** (from ACA-001 Q10). **Decided (2026-11-25):** every assignment gets one, created automatically (FR .17); students reply under a pinned opening post, so only managers post (BR .1 unchanged); with dates per group, it closes 3 days after the latest (FR .18, BR .11).
- [x] **Por responder** (from ACA-001 Q11). **Decided (2026-11-25):** private conversations awaiting the managers, plus public replies newer than the latest manager reply in their thread (BR .12).
- [ ] Should existing assignments get a Q&A channel when S02 ships? *Proposal:* yes, for assignments whose channel would still be open (latest date + 3 days in the future), created by the migration's backfill.

## 11. Slices
| Slice | Title | FRs | Status |
|---|---|---|---|
| COM-003-S01 | Replace every legacy channel with Channels + Direct (schema, API, UI, homes) | .1–.16 | In review (unit tests pass; e2e `communication/channels.spec.ts` and `direct.after.spec.ts` written, awaiting first run) |
| [COM-003-S02](../slices/COM-003-S02-assignment-channels.md) | Assignment Q&A channels: created with the assignment, pinned post, closing | .17 .18, BR .10 .11 | Ready |
| [COM-003-S03](../slices/COM-003-S03-to-answer.md) | *Por responder* for managers | .19, BR .12 | Ready |
