# IAM-001-S01 — Create org with admin invitation, accept, set up first school

| | |
|---|---|
| **FRD** | [IAM-001](../frd/IAM-001-org-invitation-onboarding.md) |
| **Implements** | FR-IAM-001.1, FR-IAM-001.2, FR-IAM-001.11, FR-IAM-001.12, FR-IAM-001.15 · BR-IAM-001.1 (new endpoints only), .3 (first-school endpoint), .4, .5, .6, .11, .12 · FR-IAM-001.4 partially (badges *Invitación enviada* / *Aceptada* only) |
| **Status** | Ready |
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
- [ ] Prisma migration: `OrganizationInvitation` model + `OrganizationInvitationStatus` enum (FRD §5); `OnboardingAuditAction` += `ORG_INVITATION_CREATED`, `ORG_INVITATION_ACCEPTED`.
- [ ] Nest (`libs/auth`):
  - `OrganizationsController` `POST v1/organizations/with-invitation` with `@UseGuards(RoleGuard)` + `@RequireRoles('SYSADMIN')`. In one transaction it creates the `Organization` (`onboardingCompleted=false`), its per-org `ORG_ADMIN` role with all permissions (extract the role-creation block from `AuthService.createSchoolWithOrganization` into a shared helper) and the invitation (hashed token). It sends the email outside the transaction. `GET v1/organizations` returns the latest invitation email and status for the badge.
  - `resend.service.ts` `sendOrganizationInvitation({ to, firstName, organizationName, link, expiresAt })` (copy from board 5).
  - `AuthSessionController` `GET v1/auth/org-invitations/:token` and `POST …/:token/accept` (`@AllowAnonymous`): look up by SHA-256 of the token, check the state (BR .5) and email (BR .6). Create the user (`emailVerified=true`, `onboardingStep` via `transitionOnboardingStep` → `school-setup`), assign role + org + `Member`, mark the invitation `ACCEPTED`, and return a JWT, all in one transaction.
  - `POST v1/auth/setup/first-school`: the caller must be `ORG_ADMIN` with `organizationId`, and the org must have 0 schools (409 otherwise).
- [ ] OpenAPI → `bun run openapi` (admin + dashboard clients).
- [ ] Angular web-admin: replace `organizations-form.ts` with the board 3 form (org + admin; expiry fixed at 7 days in this slice); show the email and badge columns in `organizations.ts`.
- [ ] Angular web-dashboard: public route `/invitacion/:token` (board 6; any unusable state shows one generic "Este enlace ya no es válido" card until S03); `setup-wizard` step 1 posts to `setup/first-school` with the name prefilled from the org (board 8).
- [ ] Tests:
  - Nest unit: token hashing, state checks (expired / accepted / wrong email), SYSADMIN-only refusal for `ORG_ADMIN` and anonymous callers, first-school refused for another org's admin and when a school exists.
  - Playwright in `web-dashboard-e2e`: seed an invitation in `fixtures.ts` + `scripts/prepare-db.ts` (known plain token), then accept → wizard step 1, tagged `@FR-IAM-001.11 @FR-IAM-001.12 @FR-IAM-001.15`.
  - Console create path: `web-admin-e2e` has no persona setup yet. Add a `sysadmin` persona there, or cover `@FR-IAM-001.1` with an API-level Playwright test against `admin-backend`. Decide at build start; adding the persona is part of this slice either way.

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
