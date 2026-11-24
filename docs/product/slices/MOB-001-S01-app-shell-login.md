# MOB-001-S01 — App shell and login

| | |
|---|---|
| **FRD** | [MOB-001](../frd/MOB-001-mobile-app.md) |
| **Implements** | FR-MOB-001.1, .2, .3, .4, BR-MOB-001.1, .3, .10 |
| **Status** | Ready |
| **Branch** | `feat/MOB-001-S01-app-shell-login` |
| **Estimate** | ≤ 3 days |

## User-visible outcome
"As a parent, teacher or student I can install the Skooltrak app on my phone, sign in with my usual account, stay signed in, and see the tabs for my role. As a school admin I'm told to use the web."

## Acceptance criteria
```gherkin
Scenario: Parent signs in and lands on Inicio
  Given a seeded parent "Carmen" with a password
  When she opens the app and signs in with her email and password
  Then she sees "Inicio" with the greeting "Buenas tardes, Carmen" (time-of-day aware)
  And the tab bar shows "Inicio", "Cursos", "Mensajes", "Pagos", "Más" with "Inicio" selected

Scenario: Session survives a restart
  Given a parent signed in on the app
  When the app is closed and opened again
  Then she lands on "Inicio" without seeing the login screen

Scenario: Tabs follow the role
  Given a seeded teacher
  When the teacher signs in
  Then the tab bar shows "Inicio", "Cursos", "Asistencia", "Mensajes", "Más"
  # Student: "Inicio", "Cursos", "Tareas", "Mensajes", "Más"

Scenario: Admins are sent to the web
  Given a seeded school admin
  When the admin signs in
  Then the app shows "Administra tu colegio desde la web" with a button "Abrir Skooltrak web"
  And no tab bar is shown

Scenario: Wrong password
  When a user signs in with a wrong password
  Then the app shows the API's error message, or "Credenciales inválidas"
  And no token is stored

Scenario: Expired session
  Given a signed-in user whose token the API now rejects with 401
  When any screen loads data
  Then the app deletes the stored token
  And shows the login screen with "Tu sesión expiró. Vuelve a iniciar sesión."

Scenario: Sign out
  Given a signed-in parent
  When she taps "Más" › "Cerrar sesión" and confirms
  Then the session is revoked on the server, the stored token is deleted and the login screen is shown
  And a request with the old token gets 401
```

Tabs other than *Inicio* and *Más* show a placeholder ("Próximamente") in this slice; S03+ fill them. *Inicio* shows only the greeting in this slice.

## Layers touched
- [ ] Prisma migration: none
- [ ] Auth (`libs/auth`): enable better-auth's `bearer` plugin in `better-auth.ts` (MOB-001 Q1). `POST /v1/auth/login` returns the session token for clients that ask for it (the web keeps its cookie + JWT unchanged); `BetterAuthGuard` resolves `Authorization: Bearer <session token>` as a better-auth session before falling back to the legacy JWT. Sign-out revokes the session. Unit tests: revoked token → 401; web cookie login unchanged.
- [ ] Nest: add the Capacitor origins (`capacitor://localhost`, `https://localhost`) to the dev CORS fallback in `apps/dashboard-backend/src/main.ts` and document them for `CORS_ORIGINS` / `TRUSTED_ORIGINS` in `deploy/.env.example`.
- [ ] OpenAPI → `bun run openapi` (login response gains the session token)
- [ ] New Nx app `apps/mobile` with `@nx/angular` (use the `nx-generate` skill), standalone + zoneless + signals, then `@capacitor/core`, `@capacitor/cli`, `ios/` and `android/` projects, a secure-storage plugin, `@capacitor/status-bar`, `@capacitor/app`. Nx targets: `serve`, `build`, `cap-sync`, `run-ios`, `run-android`.
- [ ] Data-access: an `AuthSession` service (login, restore, sign-out) and a bearer interceptor that reads the token from secure storage and clears it on 401 (reuse `libs/client-auth`'s interceptor pattern; it reads `localStorage` today, so add an async token source rather than changing web's).
- [ ] UI: login screen, tab shell per role (`BR .3`), "use the web" screen, placeholder tabs, *Más* with sign out. Design tokens from the Skooltrak design system (`libs/ui` tokens), fonts Geist / Space Grotesk bundled locally (no Google Fonts at runtime).
- [ ] Tests: unit tests for role → tabs mapping, 401 handling and token storage; Playwright against `mobile:serve` (web build of the app) tagged `@FR-MOB-001.1` … `@FR-MOB-001.4` using the e2e personas in `apps/web-dashboard-e2e/src/support/fixtures.ts`.

## Out of scope for this slice
- Real *Inicio* content (S03), push (S10), password reset (S12), app config / update screen and store builds (S02).

## Done checklist
- [ ] Acceptance criteria pass on the iOS simulator, an Android emulator and the Playwright web build
- [ ] Token is in Keychain/Keystore, not in `localStorage` or Preferences (checked in a unit test against the storage adapter)
- [ ] Wrong-role access: admin sees only the "use the web" screen (test)
- [ ] FRD slice table + `capabilities.md` updated
