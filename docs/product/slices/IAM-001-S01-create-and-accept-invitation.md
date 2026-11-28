# IAM-001-S01 — Create org with admin invitation, accept, set up first school

| | |
|---|---|
| **FRD** | [IAM-001](../frd/IAM-001-org-invitation-onboarding.md) |
| **Implements** | FR-IAM-001.1, FR-IAM-001.2, FR-IAM-001.11, FR-IAM-001.12, FR-IAM-001.15 · BR-IAM-001.1 (new endpoints only), .3 (first-school endpoint), .4, .5, .6, .11, .12 · FR-IAM-001.4 partially (badges *Invitación enviada* / *Aceptada* only) |
| **Status** | In progress |
| **Branch** | `feat/IAM-001-S01-create-and-accept-invitation` |
| **Estimate** | 3 days |

## User-visible outcome
"As a platform admin I create an organization and invite its admin from the console. As that admin, I open the email link, create my password, and set up my first school inside the organization I was invited to."

## Acceptance criteria
```gherkin
@FR-IAM-001.1 @FR-IAM-001.2
Given I am signed in to web-admin as SYSADMIN
When I open "Nueva organización", fill name "Instituto Bilingüe del Pacífico", admin "Ana Castillo" <acastillo@ibp.test>, keep "Enviar el correo ahora" checked and press "Crear y enviar invitación"
Then the organization appears in the list with admin "acastillo@ibp.test" and the badge "Invitación enviada"
And one invitation email is sent to acastillo@ibp.test containing a link "/invitacion/<token>"
And the organization has no school and onboardingCompleted = false

@FR-IAM-001.1
Given I am signed in as ORG_ADMIN of another organization
When I call POST /api/v1/organizations/with-invitation
Then the response is 403

@FR-IAM-001.11
Given a valid invitation for acastillo@ibp.test
When I open its link signed out
Then I see "Bienvenida a Instituto Bilingüe del Pacífico" with the email locked and "Ana" / "Castillo" prefilled

@FR-IAM-001.12
Given I am on a valid invitation page
When I enter a password, accept the terms and press "Crear cuenta y continuar"
Then I am signed in as ORG_ADMIN of "Instituto Bilingüe del Pacífico" with emailVerified = true
And I land on /onboarding/setup
And the console shows the badge "Aceptada"
And opening the same link again does not show the form (410 ACCEPTED)

@FR-IAM-001.12
Given an invitation whose expiresAt is in the past
When I POST its accept endpoint
Then the response is 410 with state EXPIRED and no account is created

@FR-IAM-001.15
Given I accepted my invitation and am on step 1 "Tu primera escuela"
When I submit "Instituto Bilingüe del Pacífico" / "IBP"
Then a school is created in my invited organization and no new organization is created
And submitting step 1 again returns 409 "La organización ya tiene escuelas"
```

## Layers touched
- [x] Prisma migration `20261130120000_iam001_org_invitations`: `OrganizationInvitation` + `OrganizationInvitationStatus`; `OnboardingAuditAction` += `ORG_INVITATION_CREATED`, `ORG_INVITATION_ACCEPTED`.
- [x] Nest (`libs/auth`):
  - `org-onboarding/org-onboarding.service.ts`: create with invitation, preview, accept, first school.
  - `org-onboarding/org-onboarding.controller.ts`: `OrgInvitationsAdminController` (`POST v1/organizations/with-invitation`, `RoleGuard` + `@RequireRoles('SYSADMIN')`) and `OrgInvitationsController` (`GET v1/auth/org-invitations/:token`, `POST …/:token/accept`, both `@AllowAnonymous`; `POST v1/auth/setup/first-school`).
  - `organizations/org-admin-role.ts`: the ORG_ADMIN role helper, now shared with the legacy `createSchoolWithOrganization`. `organizations/org-invitation-state.ts`: derived state (BR .5) and token hashing (BR .4).
  - `OrganizationsService.findAll` returns `adminInvitation` (latest invitation plus derived state).
  - `resend.service.ts` `sendOrganizationInvitationEmail` (HTML-escaped names). The link base is `DASHBOARD_URL`, falling back to `APP_URL`.
- [x] OpenAPI regenerated (`bun run openapi`, admin + dashboard clients).
- [x] web-admin: `organizations-form.ts` (organization + admin; edit keeps name and description only). `organizations.ts` has the *Administrador invitado* and *Estado* columns (*Invitación enviada* / *Aceptada*).
- [x] web-dashboard: public route `/invitacion/:token` (`auth/accept-org-invitation.ts`). Wizard step 1 (`onboarding/steps/school-basics.ts`) creates "Tu primera escuela" when the organization has none; the legacy path is unchanged.
- [x] Tests:
  - Nest unit: `org-onboarding.service.spec.ts` (state, hashing, create/send/failed send, preview, accept and its 410/409 refusals, the accept race, first-school scoping). `org-onboarding.controller.spec.ts` (SYSADMIN-only guard: ORG_ADMIN, ADMIN, TEACHER and member get 403, anonymous gets 401; which routes are public).
  - web-admin unit: `organizations-form.spec.ts` (`@FR-IAM-001.1` request shape, no submit without email).
  - Playwright: `web-dashboard-e2e/src/onboarding/org-invitation.spec.ts`. The console create path is tested at API level against the e2e API (no web-admin e2e harness yet), with a seeded SYSADMIN user (`data.orgInvitation.sysadmin`).

## Out of scope for this slice
- Removing "Crear una Escuela" and locking the existing `/organizations` CRUD (S02). Self-service creation keeps working until S02 ships.
- Resend, revoke, copy link, specific unusable-link states, expiry choice (S03).
- Delivery-failure status, filters, search (S04). In this slice a send failure is logged and the invitation stays `SENT`.
- Existing-account acceptance and the create-time refusal of emails already in an organization (S05, BR .13). In this slice, if the email already has an account, accept returns 409 "Este correo ya tiene una cuenta".
- Setup progress n/5 and the detail page (S06).

## Done checklist
- [ ] Acceptance criteria pass
- [ ] Cross-tenant / wrong-role access refused (test): `ORG_ADMIN` → 403 on create; another org's admin → 403/409 on first-school
- [ ] FRD slice table + `capabilities.md` updated
