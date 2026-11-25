# COM-003-S05 — Email reminder for posts not yet confirmed

| | |
|---|---|
| **FRD** | [COM-003](../frd/COM-003-channels-and-direct.md) |
| **Implements** | FR-COM-003.21; BR-COM-003.15 |
| **Status** | In review |
| **Branch** | `feat/COM-003-S05-confirmation-reminders` |
| **Estimate** | 1 day |
| **Decided** | 2026-11-25: one email to members who haven't confirmed 24 h after the post; no push |

## User-visible outcome
"As a parent or student, if I haven't confirmed a post my school asked me to confirm, I get one email the next day reminding me, with a link to the channel."

## Acceptance criteria
```gherkin
Background:
  Given the teacher published "Por favor confirmen la fecha de la prueba" asking for confirmation, 25 hours ago, in "Avisos 7°A"
  And Ana and Paula are in its audience, and neither has confirmed

Scenario: one reminder each @FR-COM-003.21 @BR-COM-003.15
  When the hourly reminder job runs
  Then Ana and Paula each get one email: "Confirma la lectura en «Avisos 7°A»", naming the channel and the post's date, with "Abrir el canal"
  And the email never contains the post's text
  When the job runs again an hour later
  Then nobody gets a second email

Scenario: who doesn't get one @BR-COM-003.15
  Given Ana confirmed the post
  Then only Paula gets an email
  And the post's author never does

Scenario: a failed send is retried
  Given the email provider refuses Paula's email
  Then nothing is recorded for her, and the next hour's run tries again

Scenario: not for closed, archived, deleted or old posts @BR-COM-003.15 @BR-COM-003.11
  Then posts in archived or closed channels, deleted posts, posts newer than 24 h and posts older than 30 days get no reminders
```

## Layers touched
- [ ] Prisma migration `20261125140000_channel_post_reminders`: `ChannelPostReminder` (`postId`, `userId`, `sentAt`), unique per post and member.
- [ ] Nest, COM (`communication/confirmation-reminders.service.ts`):
  - an hourly `@Cron` job (`ScheduleModule` is already set up), `remindDue(now)`;
  - the audience comes from `audienceMembers()` (BR .4, .10), minus who confirmed, who was reminded and the author;
  - a reminder is recorded only after a successful send, since Resend reports failures in `error` rather than throwing;
  - logs carry counts only.
- [ ] Email: reuses `sendEmail()` from `libs/auth` (Resend, `RESEND_API_KEY` / `EMAIL_FROM`, already used for invitations and grade emails), now exported. The template escapes the names and never includes the post body (§8).
- [ ] Config: `APP_URL` for the link (default `http://localhost:4200`, as in the invitations).
- [ ] Tests: Nest unit (`confirmation-reminders.service.spec.ts`): one each and recorded; confirmed and reminded skipped; a failed send not recorded; the post filter (24 h, open channels); the author excluded; escaping, the date, the link, and no post text.
- [ ] Playwright: **none**. The job runs on a schedule and sends real email, so the e2e stack can't observe it. Following up needs a mail sink in the e2e stack (for example Resend's test mode or a local SMTP catcher) and a way to trigger the job.

## Out of scope for this slice
- Push notifications (decided: none).
- Per-user email preferences or unsubscribe.
- The existing `sendEmail()` logs each recipient's address. That predates this slice and should go in a follow-up (§8).

## Done checklist
- [ ] Acceptance criteria pass (unit level; see Playwright above)
- [ ] `RESEND_API_KEY`, `EMAIL_FROM` and `APP_URL` set where the backend runs
- [ ] FRD slice table + `capabilities.md` updated
