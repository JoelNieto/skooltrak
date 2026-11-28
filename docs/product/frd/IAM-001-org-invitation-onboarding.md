# IAM-001 — Organization onboarding by invitation

| | |
|---|---|
| **Status** | Draft |
| **Context** | IAM — Identity & Access (see [capabilities](../capabilities.md)) |
| **Owner** | Joel Nieto |
| **Last updated** | 2026-11-28 |
| **Related** | Approved designs: [Org Invitation Onboarding](https://claude.ai/artifact/5K2dYEJVu5sfR4aK53Z8xC) · `.kilo/plans/1783890506900-onboarding-analysis-readme.md` · SET school setup wizard (`/onboarding/setup`) |

## 1. Problem & outcome

Today anyone who signs up can create an organization. On `/onboarding/choose-path`, "Crear una Escuela" calls `POST /api/v1/auth/create-school-with-organization` (`libs/auth/src/lib/auth.service.ts` `createSchoolWithOrganization`). That call creates an organization, an `ORG_ADMIN` role with every permission, and a school, then makes the caller its owner. Skooltrak has no control over who becomes a tenant. The platform team can't see which schools are being set up, and its admin console only manages an organization's name and description (`apps/web-admin/src/app/organizations`).

When this ships, a platform admin (`SYSADMIN`) creates the organization in `web-admin` and invites its first administrator by email. The invitee accepts with a single-use link. Their email counts as verified, so they skip the separate verification step. The link takes them straight into the existing setup wizard, where they create the organization's first school. The console stores and shows every invitation's status and the organization's setup progress. Self-service organization creation is removed. Joining an existing school or linking a child stays self-service.

**Success metric:** 100 % of organizations created after release start from a console invitation (no `create-school-with-organization` org creations), and ≥ 80 % of invitations are accepted within 7 days.

## 2. Personas & access

| Persona | Can | Permission | Scope |
|---|---|---|---|
| Platform admin (`SYSADMIN`) | Create organizations with an admin invitation; see invitation status and setup progress; resend, revoke, copy link; invite additional admins | Role check `@RequireRoles('SYSADMIN')` (see BR .1) | All organizations |
| Invitee (prospective `ORG_ADMIN`) | Open the link, create an account or sign in, accept, run the setup wizard | Possession of a valid invitation token (anonymous endpoint) | The invited organization only |
| School admin (`ORG_ADMIN`) | Finish the setup wizard for their own organization | Existing `ORG_ADMIN` role created on acceptance | Own organization |
| Prospective user (no invitation) | Sign up and join a school or link a child (unchanged); **cannot** create an organization | — | Self |

> **New authorization path, no new `Perm.*` key.** A permission key can't restrict these endpoints to the platform: `PermissionsGuard` (`libs/auth/src/lib/auth.guard.ts:215`) lets `ORG_ADMIN`, `ADMIN` and `SYSADMIN` pass any permission check. They are guarded with the existing but currently unused `RoleGuard` / `@RequireRoles('SYSADMIN')`.

## 3. Functional requirements

**Console: create and invite**
- **FR-IAM-001.1** — Platform admin can create an organization (name, description) together with its first administrator (first name, last name, email) in one form ("Nueva organización" → "Crear y enviar invitación"), so the organization exists and its admin is invited in one action.
- **FR-IAM-001.2** — When "Enviar el correo ahora" is checked (default), the invitee receives an invitation email with an "Aceptar invitación" button and the plain link. It is sent through the existing Resend email service (`libs/auth/src/lib/resend.service.ts`). When unchecked, the invitation is created and only its link can be copied (FR .9).
- **FR-IAM-001.3** — Platform admin can choose the link's lifetime: 3, 7 (default) or 14 days.

**Console: status**
- **FR-IAM-001.4** — Platform admin sees on the Organizations list one status per organization, derived from its latest admin invitation and setup progress: *Invitación enviada*, *Correo no entregado*, *Expirada*, *Revocada*, *Aceptada*, *En configuración · n/5*, *Activa*. They also see the invited admin's name and email and a "Última actividad" line.
- **FR-IAM-001.5** — Platform admin can filter the list by *Requieren atención* (correo no entregado or expirada), *Invitación pendiente*, *En configuración* and *Activas*, with counts, and search by organization name or invitee email.
- **FR-IAM-001.6** — Platform admin can open an organization's detail page and see setup progress per wizard step, an activity log (invitation sent, resent, revoked, accepted, school created, step completed, onboarding completed) and every admin invitation with its status.

**Console: actions**
- **FR-IAM-001.7** — Platform admin can **resend** a pending, expired or undelivered invitation. This issues a new link, marks the previous invitation *Reemplazada* and sends the email again.
- **FR-IAM-001.8** — Platform admin can **revoke** a pending invitation; its link stops working immediately.
- **FR-IAM-001.9** — Platform admin can **copy** the link of a pending invitation to share it by another channel.
- **FR-IAM-001.10** — Platform admin can invite **another administrator** to an existing organization from its detail page.

**Invitee**
- **FR-IAM-001.11** — Invitee opening a valid link sees the organization name, the steps ahead, and a form with their email locked and their name prefilled. They set a password and accept the terms to create their account ("Crear cuenta y continuar").
- **FR-IAM-001.12** — On acceptance the invitee becomes `ORG_ADMIN` of the invited organization. The existing per-organization `ORG_ADMIN` role, `Member` and `organizationId` assignments are reused. Their email is marked verified and they land on `/onboarding/setup`.
- **FR-IAM-001.13** — Invitee whose email already has a Skooltrak account can sign in from the link ("Inicia sesión para aceptar") and accept. Whether that is allowed for accounts already in another organization is Open question 1.
- **FR-IAM-001.14** — Invitee opening an unusable link sees a dedicated state instead of the form: *Esta invitación venció*, *Este enlace ya no es válido* (revoked or superseded), *Ya aceptaste esta invitación* (→ sign in, resume setup), *Esta invitación es para otra cuenta* (signed in with another email → "Cerrar sesión y continuar").

**Setup**
- **FR-IAM-001.15** — The first wizard step, "Tu primera escuela", creates the first school **inside the invited organization**, prefilled with the organization name. It does not create an organization. Steps 2–5 (grados, planes de estudio, cursos, grupos) are unchanged.
- **FR-IAM-001.16** — The wizard records the current step, so the console shows *En configuración · n/5* and the admin resumes where they left off. Finishing (the existing `complete-onboarding`) makes the organization *Activa*.

**Self-service removed**
- **FR-IAM-001.17** — A prospective user without an invitation no longer sees "Crear una Escuela" on `/onboarding/choose-path`. They see "Unirme a una escuela", "Tengo un código de mi hijo", and a "¿Quieres llevar Skooltrak a tu institución?" card linking to a contact destination (Open question 3).

## 4. Business rules

- **BR-IAM-001.1** — Only `SYSADMIN` can create organizations or create, resend, revoke, list or copy admin invitations. Any other role gets **403** "You do not have the required role to perform this action", including `ORG_ADMIN`. The guard is `@RequireRoles('SYSADMIN')`, never a `Perm.*` key (see §2). This also applies to the existing `POST/PATCH/DELETE /api/v1/organizations` and `GET /api/v1/organizations`, which today only require authentication.
- **BR-IAM-001.2** — `web-admin` lets in only `SYSADMIN`. Today `apps/web-admin/src/app/auth/auth.ts` navigates any authenticated user to `/home`. A non-`SYSADMIN` login is refused with "Esta consola es solo para el equipo de Skooltrak."
- **BR-IAM-001.3** — `create-school-with-organization` no longer creates organizations. A caller without an accepted invitation gets **403** "La creación de organizaciones es por invitación." The first-school step uses an endpoint scoped to the caller's `organizationId`, and it is refused with **409** "La organización ya tiene escuelas" if a school exists (later schools are added from Escuelas).
- **BR-IAM-001.4** — The invitation token is random (≥ 128 bits) and single-use. Only its SHA-256 hash is stored. The plain token is shown only in the email and by "Copiar enlace", and is never logged.
- **BR-IAM-001.5** — An invitation is usable only while `status = SENT | DELIVERY_FAILED` and `now < expiresAt`. Otherwise accept returns **410** with a state code `EXPIRED | REVOKED | SUPERSEDED | ACCEPTED` that drives FR .14. *Expirada* is derived from `expiresAt`, never stored.
- **BR-IAM-001.6** — Accept requires the authenticated or newly created account's email to equal the invitation email (case-insensitive). On a mismatch it returns **403** `WRONG_ACCOUNT` → FR .14 "otra cuenta".
- **BR-IAM-001.7** — At most one pending (`SENT | DELIVERY_FAILED`, unexpired) admin invitation per organization and email. Creating a duplicate returns **409** "Ya hay una invitación pendiente para este correo". Resend is the way to re-send it.
- **BR-IAM-001.8** — Resend sets the current invitation to `SUPERSEDED` and creates a new one with a fresh token and expiry, in one transaction. Only `SENT`, `DELIVERY_FAILED` or expired invitations can be resent. `ACCEPTED`, `REVOKED` or `SUPERSEDED` → **409**.
- **BR-IAM-001.9** — Revoke applies only to pending invitations (any other state → **409**). A revoked organization with no accepted admin shows *Revocada* with "Invitar de nuevo" (a new invitation, possibly to a different email).
- **BR-IAM-001.10** — If the email send fails (Resend returns `error` or throws), the invitation is kept with `status = DELIVERY_FAILED` and the error name (no recipient or body, per the logging rule in `resend.service.ts`), and the console shows *Correo no entregado*. The create call still succeeds, so the link can be copied.
- **BR-IAM-001.11** — The organization is created with `onboardingCompleted = false` and **no school**. It becomes *Activa* only when `complete-onboarding` runs for a user who is `ORG_ADMIN` of that organization.
- **BR-IAM-001.12** — Email for a new account created via an invitation is set `emailVerified = true`. Ownership was proven by the link, so the `send-verification-link` step is skipped.

## 5. Data

- **New model `OrganizationInvitation`** (table `organization_invitations`): `id`, `organizationId` → `Organization` (cascade), `email` (lower-cased), `firstName`, `lastName`, `tokenHash` (unique), `status` enum `OrganizationInvitationStatus { SENT, DELIVERY_FAILED, ACCEPTED, REVOKED, SUPERSEDED }`, `expiresAt`, `sentAt?`, `lastSendError?`, `sendAttempts` (int), `invitedById` → `User`, `acceptedAt?`, `acceptedByUserId?`, `revokedAt?`, `revokedById?`, `supersededById?`, `createdAt`, `updatedAt`. Indexes on `organizationId`, `email`, `(organizationId, status)`.
  - Not reused: the better-auth `Invitation` table can't store a hashed token or send failures. `AuthToken` is per-user/student and has no status lifecycle. The relationship with `Invitation` is Open question 4.
- **`Organization`**, new fields: `setupStep Int @default(0)` (0 = not started, 1–5 = last completed wizard step), `activatedAt DateTime?` (set with `onboardingCompleted`).
- **`User.onboardingStep`**: invitee accounts move `null → school-setup → completed`. That path is already allowed in `libs/auth/src/lib/onboarding-step.ts` (`null → SCHOOL_SETUP`), so the state machine needs no change. `choose-path → school-setup` stays only for legacy users mid-setup at release.
- **Audit**: extend `OnboardingAuditAction` with `ORG_INVITATION_CREATED`, `ORG_INVITATION_RESENT`, `ORG_INVITATION_REVOKED`, `ORG_INVITATION_ACCEPTED`, `ORG_INVITATION_EMAIL_FAILED`, `ORG_SETUP_STEP_COMPLETED`, `ORG_ACTIVATED`, written to `OnboardingAuditLog` with `organizationId`, `actorId` and `userId`. The detail page's activity log (FR .6) reads from it.
- **Tenancy**: console endpoints are cross-organization by design (`SYSADMIN` only). Every invitee endpoint resolves the organization **from the token**, never from the request body. Setup endpoints use the caller's JWT `organizationId`.

## 6. API surface

All paths under `/api/v1`. Console endpoints live in `libs/auth` `OrganizationsController` (served by `admin-backend` on :5050, as today).

| Method & path | Purpose | Guard | FRs |
|---|---|---|---|
| `POST /organizations/with-invitation` | Create org + first admin invitation (+ send) | `SYSADMIN` | .1 .2 .3 |
| `GET /organizations?status=&q=` | List with derived onboarding status, invitee, last activity, counts | `SYSADMIN` | .4 .5 |
| `GET /organizations/:id/onboarding` | Setup progress, activity log, invitations | `SYSADMIN` | .6 |
| `POST /organizations/:id/invitations` | Invite another admin | `SYSADMIN` | .10 |
| `POST /organizations/invitations/:invitationId/resend` | Supersede + new link + send | `SYSADMIN` | .7 |
| `POST /organizations/invitations/:invitationId/revoke` | Revoke | `SYSADMIN` | .8 |
| `GET /organizations/invitations/:invitationId/link` | Return the link (re-issues the token if the plain one isn't recoverable, see Open question 5) | `SYSADMIN` | .9 |
| `GET /auth/org-invitations/:token` | Public preview: org name, invitee name/email, expiry, or state code | `@AllowAnonymous` | .11 .14 |
| `POST /auth/org-invitations/:token/accept` | `{ firstName, lastName, password, acceptTerms }` for a new account, or empty body with a session for an existing one → JWT | `@AllowAnonymous` / session | .11 .12 .13 |
| `POST /auth/setup/first-school` | Create first school in caller's org | `ORG_ADMIN` of caller org | .15 |
| `POST /auth/setup/step` | `{ step: 1..5 }` record progress | `ORG_ADMIN` of caller org | .16 |
| `POST /auth/create-school-with-organization` | **Changed:** 403 per BR .3 (removed after one release) | — | .17 |

Side effects: invitation email (Resend). There are no sockets or cron jobs. Expiry is derived at read time.

## 7. UX

Design reference: the approved canvas, boards 1–9.

- **web-admin**: `/organizations` gains the status column, filter tabs, search and row actions (board 2). The "Nueva organización" dialog is replaced by the org + admin + invitation form (board 3). A new route `/organizations/:id` holds the detail page (board 4).
- **Email**: subject "Te invitamos a administrar {org} en Skooltrak" (board 5).
- **web-dashboard**: a new public route `/invitacion/:token` with the accept page (board 6) and its unusable-link states (board 7). `/onboarding/setup` step 1 becomes "Tu primera escuela" (board 8), with a header "Configurando {org}" and "Se guarda solo · puedes salir y volver". `/onboarding/choose-path` drops "Crear una Escuela" (board 9). `/onboarding/create-school` is removed.
- **States**: list empty ("Aún no hay organizaciones"), skeleton, error with retry (existing `listState` / `UiTable*`). Status badges always pair an icon with a word, never colour alone. Pending and expired use `warning`, failures use `danger`, Activa uses `success`. `accent` is reserved for "new".
- **Components**: `libs/ui` only (`Button`, `UiField`, `UiInput`, `UiTable*`, `UiRowActions`, `Modal`, `Toast`, `Card`, `Alert`, `ui-icon` Lucide registry). No raw palette colours.

## 8. Non-functional

- **Security**: hashed single-use tokens (BR .4). Rate-limit `GET /auth/org-invitations/:token` and `accept` per IP (reuse the magic-link throttling approach). Use constant-time hash lookup. Show no invitee data for an unknown token.
- **Privacy**: never log recipient, subject, body or token (existing `resend.service.ts` rule).
- **i18n**: UI and email in Spanish (copy as in the designs). English parity follows the product's existing i18n approach.
- **Accessibility**: real `<button>`/`<a>`/`<label>`; the dialog uses `Modal` focus handling; touch targets ≥ 44 px on the public pages.
- **Mobile**: accept page and wizard work at phone width (the invitee may open the email on a phone).

## 9. Out of scope

- Email open/click tracking (would need Resend webhooks).
- Inviting teachers, students or parents (existing admin-created flows are unchanged).
- Platform admin pre-creating the first school (decided: organization only).
- Billing or plan selection at creation.
- Migrating organizations created by self-service before release. They keep working and show as *Activa* or *En configuración* from `onboardingCompleted`, with no invitation row.

## 10. Open questions

- [ ] **1. Existing account in another organization** (blocks S05). `User` has a single `organizationId`/`roleId`, so a parent at school A can't also be `ORG_ADMIN` of B. Proposal: refuse at create time with 409 "Este correo ya pertenece a otra organización; usa otro correo", and allow existing accounts only when they have no organization.
- [ ] **2. "Pedir un enlace nuevo" on an expired link** (blocks S03). Should it notify platform admins (in-app, or an email to a support address), or should the page just say to contact Skooltrak?
- [ ] **3. Contact destination** for "Solicitar una demostración" on choose-path (URL or email). Blocks S02's copy only.
- [ ] **4. Better-auth `Invitation` table**: nothing in the product uses it except the dashboard's `/accept-invitation/:id`. Keep it as is, or deprecate it in a later IAM FRD?
- [ ] **5. "Copiar enlace" with hashed tokens**: the plain token can't be recovered after creation. Proposal: copying re-issues the token (equivalent to a silent resend without email) and logs `ORG_INVITATION_RESENT`. Alternative: store the token encrypted.
- [ ] **6. Gap found (fixed by S02)**: `OrganizationsController` (`libs/auth/src/lib/organizations/organizations.controller.ts`) lets **any authenticated user** create, list, update and delete organizations (`BetterAuthGuard` only), and `web-admin` doesn't check the role at login. Both are pre-existing and covered by BR .1 and BR .2.
- [ ] **7. Legacy users mid-setup** at release (`onboardingStep = school-setup` from self-service): let them finish (recommended), or reset them?

## 11. Slices

| Slice | Title | FRs / BRs | Status |
|---|---|---|---|
| [IAM-001-S01](../slices/IAM-001-S01-create-and-accept-invitation.md) | Create org with admin invitation → accept with new account → first school in invited org | .1 .2 .11 .12 .15 · BR .1 (new endpoints) .3 (first-school) .4 .5 .6 .11 .12 | Ready |
| IAM-001-S02 | Close self-service creation: lock org endpoints and web-admin to SYSADMIN, choose-path without "Crear escuela" | .17 · BR .1 (existing endpoints) .2 .3 | Proposed |
| IAM-001-S03 | Resend, revoke, copy link and unusable-link states | .3 .7 .8 .9 .14 · BR .5 .7 .8 .9 | Proposed |
| IAM-001-S04 | Delivery failures, status column, filters and search | .4 .5 · BR .10 | Proposed |
| IAM-001-S05 | Accept with an existing account and wrong-account state | .13 .14 (otra cuenta) · BR .6 | Proposed (blocked by Q1) |
| IAM-001-S06 | Setup progress n/5, Activa, org detail page with activity log | .6 .16 | Proposed |
| IAM-001-S07 | Invite additional administrators | .10 · BR .7 | Proposed |
