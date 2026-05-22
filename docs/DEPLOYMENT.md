# Skooltrak Platform - Deployment Guide

This guide covers deploying the Skooltrak platform to Railway with Neon PostgreSQL, Cloudflare R2, and Resend. The stack is an **Nx** monorepo: **Angular 21** standalone frontends (with SSR), **NestJS 11** backends with **typed REST** (OpenAPI/Swagger) and **Socket.IO** for live chat, **Prisma 7** + PostgreSQL, and **Bun** as the package manager / runtime for backends and CI builds.

## Current Status

| Area            | Version / detail                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Package manager | Bun `1.2.2` (see root `package.json`)                                                                      |
| Nx              | `22.6.5`                                                                                                   |
| Angular         | `21.1.1`                                                                                                   |
| NestJS          | `11`                                                                                                       |
| Prisma          | `7`                                                                                                        |
| API             | REST at `/api/v1/*` (Swagger at `/api/docs`); live chat via Socket.IO at `/socket.io` on dashboard-backend |

### Deployable apps

| App                 | Role                                                                                                   | Dockerfile today                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `web-dashboard`     | Angular SSR app: dashboard, onboarding, authenticated features, public school store under `/store/...` | [apps/web-dashboard/Dockerfile](../apps/web-dashboard/Dockerfile) — Node **20** SSR, default `PORT` **4200** |
| `web-admin`         | Standalone Angular SSR admin app                                                                       | [apps/web-admin/Dockerfile](../apps/web-admin/Dockerfile)                                                    |
| `dashboard-backend` | NestJS REST + Socket.IO, port `3000`                                                                   | [apps/dashboard-backend/Dockerfile](../apps/dashboard-backend/Dockerfile)                                    |
| `admin-backend`     | NestJS REST, port `5050`                                                                               | [apps/admin-backend/Dockerfile](../apps/admin-backend/Dockerfile)                                            |

**CI:** The repo is hosted on **GitHub**. The CI definition at `.gitlab-ci.yml` (legacy filename) installs Bun, runs `bun nx run-many -t lint test build e2e`, then `bun nx fix-ci` (Nx Cloud self-healing), and can run a manual deploy with `railway up --detach` on `main`. When using **GitHub Actions** exclusively, port these steps into `.github/workflows/` and remove or replace the legacy file.

## Architecture Overview

The school dashboard, onboarding, authenticated features, and public school store are all served by **`web-dashboard`** (Angular SSR). REST traffic goes to `dashboard-backend` at `/api/v1/*`. Admin uses a separate Angular SSR app and `admin-backend`.

```mermaid
flowchart TB
    cf["Cloudflare DNS / CDN"]
    subgraph Railway
      dash["web-dashboard<br/>Angular SSR<br/>app.skooltrak.com / store.skooltrak.com"]
      admin["web-admin<br/>Angular SSR<br/>admin.skooltrak.com"]
      api["dashboard-backend<br/>NestJS REST + Socket.IO<br/>api.skooltrak.com"]
      apiAdmin["admin-backend<br/>NestJS REST<br/>api-admin.skooltrak.com"]
    end
    neon[("Neon Postgres")]
    r2[("Cloudflare R2")]
    resend["Resend"]
    cf --> dash
    cf --> admin
    cf --> api
    cf --> apiAdmin
    dash -->|"/api/v1/*"| api
    admin -->|"/api/v1/*"| apiAdmin
    dash -.->|"/socket.io"| api
    api --> neon
    apiAdmin --> neon
    api --> r2
    apiAdmin --> r2
    api --> resend
    apiAdmin --> resend
```

## Prerequisites

- [Railway](https://railway.app) account
- [Neon](https://neon.tech) account (PostgreSQL)
- [Cloudflare](https://cloudflare.com) account (R2, DNS)
- [Resend](https://resend.com) account (Email)
- Domain name (e.g., skooltrak.com)
- **Bun** `1.2.2` (or compatible) for local scripts and Docker build stages
- **Node.js 20** — required at runtime for `web-admin` and `web-dashboard` SSR in their Docker images; not required on your laptop if you only use Bun + Nx via the repo
- Optional: **Nx Cloud** token for CI features (see CI config at repo root / Nx docs)

## Phase 1: Database Setup

### 1.1 Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Select **AWS São Paulo (sa-east-1)** region for LATAM
4. Copy the connection string (add `?sslmode=require` if not present)

### 1.2 Run Migrations

Prisma **7** generates the client used by NestJS and (via build) some Angular code that references `@generated/prisma`.

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Run migrations
bun prisma migrate deploy

# Seed initial admin (optional)
bun run prisma/scripts/seed-admin.ts
```

## Phase 2: Railway Setup

### 2.1 Create Railway Project

1. Create a new project at [Railway](https://railway.app/new)
2. Add **4** services: `dashboard-backend`, `admin-backend`, `web-dashboard`, `web-admin`

### 2.2 Configure Each Service

For each service, set in Railway dashboard (repo root = monorepo root):

| Setting         | dashboard-backend                   | admin-backend                   | web-admin                   | web-dashboard                   |
| --------------- | ----------------------------------- | ------------------------------- | --------------------------- | ------------------------------- |
| Root Directory  | `/`                                 | `/`                             | `/`                         | `/`                             |
| Dockerfile Path | `apps/dashboard-backend/Dockerfile` | `apps/admin-backend/Dockerfile` | `apps/web-admin/Dockerfile` | `apps/web-dashboard/Dockerfile` |

**Default ports (set via `EXPOSE` / `ENV PORT` in Dockerfiles or Railway):**

| Service                  | Port                          |
| ------------------------ | ----------------------------- |
| dashboard-backend        | `3000`                        |
| admin-backend            | `5050`                        |
| web-admin                | `4300`                        |
| web-dashboard (Node SSR) | `4200` (override with `PORT`) |

**Via environment variable:** set `RAILWAY_DOCKERFILE_PATH` per service to the paths above.

### 2.3 Connect Repository

- Connect your **GitHub** repository to Railway
- Railway can auto-deploy on push to `main` (or your chosen branch)
- Or use manual deploy from CI (see Phase 5)

## Phase 3: Environment Variables

Configure these in Railway for **backend** services (`dashboard-backend`, `admin-backend`):

| Variable                          | Description                                                    | Example                             |
| --------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `DATABASE_URL`                    | Neon connection string                                         | `postgresql://...?sslmode=require`  |
| `BETTER_AUTH_SECRET`              | Auth secret                                                    | `openssl rand -base64 32`           |
| `JWT_SECRET`                      | JWT signing secret                                             | Same as `BETTER_AUTH_SECRET`        |
| `APP_URL`                         | Public app URL                                                 | `https://skooltrak.com`             |
| `CORS_ORIGINS`                    | Allowed browser origins (comma-separated, no trailing slashes) | See below                           |
| `TRUSTED_ORIGINS`                 | Better Auth trusted origins                                    | Typically align with `CORS_ORIGINS` |
| `CLOUDFLARE_R2_ENDPOINT`          | R2 endpoint URL                                                | From Cloudflare R2                  |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`     | R2 access key                                                  | From Cloudflare R2                  |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret                                                      | From Cloudflare R2                  |
| `CLOUDFLARE_R2_BUCKET`            | R2 bucket name                                                 | Your bucket name                    |
| `RESEND_API_KEY`                  | Resend API key                                                 | From Resend dashboard               |
| `EMAIL_FROM`                      | From email                                                     | `Skooltrak <noreply@skooltrak.com>` |

### admin-backend CORS

Set `CORS_ORIGINS` to include **`https://admin.skooltrak.com`** (web-admin origin).

### dashboard-backend CORS

Include every origin that calls **`/api/v1/*`** or **`/socket.io`** in the browser. Typically just the dashboard origin:

- `https://skooltrak.com` (web-dashboard primary domain)
- `https://app.skooltrak.com` (if you serve the dashboard on a subdomain)

Example:

`https://skooltrak.com,https://app.skooltrak.com`

Adjust if you use different hostnames.

### REST API and Socket.IO

- REST: **`/api/v1/*`** (OpenAPI docs at **`/api/docs`**, JSON at **`/api/openapi.json`**)
- Live chat: **Socket.IO** at **`/socket.io`** on dashboard-backend (proxied same-origin in dev)

When using a reverse proxy on the dashboard domain, route **`/api/*`** and **`/socket.io`** to **dashboard-backend**.

### Frontend / proxy

If you keep **same-origin** API calls from the dashboard (e.g. `skooltrak.com/api/...` → backend), configure Cloudflare or a Worker to route **`/api/*`** and **`/socket.io`** to `dashboard-backend`. If clients call **`https://api.skooltrak.com`** directly, ensure CORS and cookies (if any) match your auth setup.

## Phase 4: Domain Configuration

### 4.1 Railway Custom Domains

| Service           | Suggested domain                     |
| ----------------- | ------------------------------------ |
| web-dashboard     | skooltrak.com (or app.skooltrak.com) |
| web-admin         | admin.skooltrak.com                  |
| dashboard-backend | api.skooltrak.com                    |
| admin-backend     | api-admin.skooltrak.com              |

### 4.2 Cloudflare DNS

1. Add your domain to Cloudflare
2. Create CNAME (or Railway-provided targets) for:
   - `skooltrak.com` → Railway **web-dashboard**
   - `admin` → Railway **web-admin**
   - `api` → Railway **dashboard-backend**
   - `api-admin` → Railway **admin-backend**

### 4.3 Reverse proxy

- **Same-origin API:** route `/api/*` and `/socket.io` on the dashboard domain to **dashboard-backend** (Worker or Cloudflare rules). This avoids cross-origin cookies and simplifies CORS.

## Phase 5: CI/CD (GitHub)

The pipeline in `.gitlab-ci.yml` uses a **Node 20** image, installs **Bun**, then:

1. `bun install --no-cache`
2. `bun playwright install --with-deps`
3. `bun nx run-many -t lint test build e2e`
4. `bun nx fix-ci` (after_script; Nx Cloud self-healing)

Runs on `main` and merge requests (test stage). **Deploy** stage (`deploy` job) is **manual**, **only on `main`**, and runs:

- Install Railway CLI
- `railway up --detach`

If you standardize on **GitHub Actions**, recreate the same jobs in `.github/workflows/` (and add `RAILWAY_TOKEN` as a repository secret).

### Manual deploy via GitHub Actions

1. Add `RAILWAY_TOKEN` as a **repository secret** (GitHub → **Settings** → **Secrets and variables** → **Actions**)
   - Create a token in Railway (Project Settings → Tokens)
2. `railway link` locally selects **one** default service; **`railway up` deploys that linked service only**
3. For **four** services, either:
   - Use **Railway Git integration** so each service builds and deploys from the same repo with its own `RAILWAY_DOCKERFILE_PATH`, or
   - Maintain **separate CI jobs / tokens** per service, or run `railway up` with the correct service context per deployment

### Automatic deploy via Railway

1. Connect the **GitHub** repo in Railway
2. Each service uses its Dockerfile path from the monorepo root
3. Configure branch triggers (e.g. `main`) per service

## Phase 6: Local Docker Verification

Test images locally before deploying (from repository root):

```bash
# dashboard-backend (REST at http://localhost:3000/api/v1, Swagger at /api/docs)
docker build -f apps/dashboard-backend/Dockerfile -t skooltrak-dashboard-backend .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." skooltrak-dashboard-backend

# admin-backend
docker build -f apps/admin-backend/Dockerfile -t skooltrak-admin-backend .
docker run -p 5050:5050 -e DATABASE_URL="postgresql://..." skooltrak-admin-backend

# web-admin (Angular SSR)
docker build -f apps/web-admin/Dockerfile -t skooltrak-web-admin .
docker run -p 4300:4300 skooltrak-web-admin

# web-dashboard (Angular SSR)
docker build -f apps/web-dashboard/Dockerfile -t skooltrak-web-dashboard .
docker run -p 4200:4200 skooltrak-web-dashboard
```

## Cost Estimate (Monthly)

| Service               | Cost                        |
| --------------------- | --------------------------- |
| Railway (4 services)  | ~$20–80 (usage varies)      |
| Neon PostgreSQL (Pro) | $19                         |
| Cloudflare R2         | ~$5 (usage-based)           |
| Cloudflare CDN        | Free tier                   |
| Resend                | Free tier (3k emails/month) |
| **Total**             | **~$44–104/month** (rough)  |

## Troubleshooting

### Build fails with "Cannot find module '@generated/prisma'"

Ensure Prisma client is generated during the Docker build. Dockerfiles run `bunx prisma generate` before the Nx build. Backend images also copy `generated/` and link `node_modules/@generated/prisma` — keep that pattern if you add new Dockerfiles.

### REST 401/403 or CORS on `/api/v1/*`

- Verify `CORS_ORIGINS` includes every browser origin that calls the API (dashboard + admin as applicable).
- Ensure the reverse proxy forwards **`Authorization`** headers and WebSocket upgrades for **`/socket.io`**.

### CORS errors in production

Verify `CORS_ORIGINS` includes your frontend URLs (with `https://`). No trailing slashes.

### Database connection fails

- Check `DATABASE_URL` includes `?sslmode=require` for Neon
- Neon typically allows connections from cloud providers without IP allowlisting

### Frontend can't reach API

- **Same domain:** ensure the reverse proxy routes `/api` and `/socket.io` to **dashboard-backend**
- **Subdomain API:** point frontends at `https://api.skooltrak.com/api/v1/*` and ensure CORS is set on the backend

### `@generated/prisma` missing at runtime (backend)

Same as build-time: both NestJS Dockerfiles must keep Prisma `generated` output and the `@generated/prisma` symlink step; do not omit when customizing images.
