# Skooltrak Platform - Deployment Guide

This guide covers deploying the Skooltrak platform to Railway with Neon PostgreSQL, Cloudflare R2, and Resend. The stack is an **Nx** monorepo: **Angular 21** frontends (including **native federation** with a shell host and remotes), **NestJS 11** backends with **GraphQL** (Apollo), **Prisma 7** + PostgreSQL, and **Bun** as the package manager / runtime for backends and CI builds.

## Current Status

| Area | Version / detail |
|------|------------------|
| Package manager | Bun `1.2.2` (see root `package.json`) |
| Nx | `22.6.5` |
| Angular | `21.1.1` |
| NestJS | `11` |
| Prisma | `7` |
| API | GraphQL via `@nestjs/graphql` + Apollo (HTTP path `/api/graphql`; WebSocket subscriptions enabled on dashboard-backend) |

### Deployable apps

| App | Role | Dockerfile today |
|-----|------|------------------|
| `web-shell` | Native federation **host** (CSR, nginx serving static assets; loads remotes via `federation.manifest.json`) | [apps/web-shell/Dockerfile](../apps/web-shell/Dockerfile) |
| `web-dashboard` | Federation **remote** (SSR), exposes `./routes` | [apps/web-dashboard/Dockerfile](../apps/web-dashboard/Dockerfile) — Node **20** SSR, default `PORT` **4202** |
| `web-store` | Federation **remote** (CSR), exposes `./routes` | [apps/web-store/Dockerfile](../apps/web-store/Dockerfile) — nginx static, port **80** |
| `web-admin` | Standalone Angular SSR app | [apps/web-admin/Dockerfile](../apps/web-admin/Dockerfile) |
| `dashboard-backend` | NestJS + GraphQL, port `3000` | [apps/dashboard-backend/Dockerfile](../apps/dashboard-backend/Dockerfile) |
| `admin-backend` | NestJS + GraphQL, port `5050` | [apps/admin-backend/Dockerfile](../apps/admin-backend/Dockerfile) |

**CI:** The repo is hosted on **GitHub**. The CI definition at `.gitlab-ci.yml` (legacy filename) installs Bun, runs `bun nx run-many -t lint test build e2e`, then `bun nx fix-ci` (Nx Cloud self-healing), and can run a manual deploy with `railway up --detach` on `main`. When using **GitHub Actions** exclusively, port these steps into `.github/workflows/` and remove or replace the legacy file.

## Architecture Overview

The public “school” experience is a **federation shell** (`web-shell`) that loads **remotes** at runtime (`web-dashboard`, `web-store`). GraphQL traffic goes to `dashboard-backend` at `/api/graphql`. Admin uses a separate Angular SSR app and `admin-backend`.

```mermaid
flowchart TB
    cf["Cloudflare DNS / CDN"]
    subgraph Railway
      shell["web-shell<br/>nginx static<br/>skooltrak.com"]
      dash["web-dashboard<br/>Angular SSR remote<br/>app.skooltrak.com"]
      store["web-store<br/>Angular CSR remote<br/>store.skooltrak.com"]
      admin["web-admin<br/>Angular SSR<br/>admin.skooltrak.com"]
      api["dashboard-backend<br/>NestJS + GraphQL<br/>api.skooltrak.com"]
      apiAdmin["admin-backend<br/>NestJS + GraphQL<br/>api-admin.skooltrak.com"]
    end
    neon[("Neon Postgres")]
    r2[("Cloudflare R2")]
    resend["Resend"]
    cf --> shell
    cf --> dash
    cf --> store
    cf --> admin
    cf --> api
    cf --> apiAdmin
    shell -.->|"federation.manifest.json"| dash
    shell -.->|"federation.manifest.json"| store
    shell -->|"/api/graphql"| api
    admin -->|"/api/graphql"| apiAdmin
    dash -->|"/api/graphql"| api
    store -->|"/api/graphql"| api
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
- **Node.js 20** — required at runtime for `web-admin` (and for `web-dashboard` SSR) in their Docker images; not required on your laptop if you only use Bun + Nx via the repo
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
2. Add **6** services: `dashboard-backend`, `admin-backend`, `web-shell`, `web-dashboard`, `web-store`, `web-admin`

### 2.2 Configure Each Service

For each service, set in Railway dashboard (repo root = monorepo root):

| Setting | dashboard-backend | admin-backend | web-admin | web-shell | web-dashboard | web-store |
|---------|-------------------|---------------|-----------|-----------|---------------|-----------|
| Root Directory | `/` | `/` | `/` | `/` | `/` | `/` |
| Dockerfile Path | `apps/dashboard-backend/Dockerfile` | `apps/admin-backend/Dockerfile` | `apps/web-admin/Dockerfile` | `apps/web-shell/Dockerfile` | `apps/web-dashboard/Dockerfile` | `apps/web-store/Dockerfile` |

**Default ports (set via `EXPOSE` / `ENV PORT` in Dockerfiles or Railway):**

| Service | Port |
|---------|------|
| dashboard-backend | `3000` |
| admin-backend | `5050` |
| web-admin | `4300` |
| web-dashboard (Node SSR remote) | `4202` (override with `PORT`) |
| web-shell (nginx) | `80` (map to public HTTP/HTTPS in Railway) |
| web-store (nginx) | `80` (map to public HTTP/HTTPS in Railway) |

**Via environment variable:** set `RAILWAY_DOCKERFILE_PATH` per service to the paths above.

### 2.3 Connect Repository

- Connect your **GitHub** repository to Railway
- Railway can auto-deploy on push to `main` (or your chosen branch)
- Or use manual deploy from CI (see Phase 5)

## Phase 3: Environment Variables

Configure these in Railway for **backend** services (`dashboard-backend`, `admin-backend`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon connection string | `postgresql://...?sslmode=require` |
| `BETTER_AUTH_SECRET` | Auth secret | `openssl rand -base64 32` |
| `JWT_SECRET` | JWT signing secret | Same as `BETTER_AUTH_SECRET` |
| `APP_URL` | Public app URL (shell / marketing) | `https://skooltrak.com` |
| `CORS_ORIGINS` | Allowed browser origins (comma-separated, no trailing slashes) | See below |
| `TRUSTED_ORIGINS` | Better Auth trusted origins | Typically align with `CORS_ORIGINS` |
| `CLOUDFLARE_R2_ENDPOINT` | R2 endpoint URL | From Cloudflare R2 |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key | From Cloudflare R2 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret | From Cloudflare R2 |
| `CLOUDFLARE_R2_BUCKET` | R2 bucket name | Your bucket name |
| `RESEND_API_KEY` | Resend API key | From Resend dashboard |
| `EMAIL_FROM` | From email | `Skooltrak <noreply@skooltrak.com>` |

### admin-backend CORS

Set `CORS_ORIGINS` to include **`https://admin.skooltrak.com`** (web-admin origin).

### dashboard-backend CORS

Include every origin that calls **`/api/graphql`** in the browser:

- `https://skooltrak.com` (shell)
- `https://app.skooltrak.com` (dashboard remote, if used on its own origin)
- `https://store.skooltrak.com` (store remote)

Example:

`https://skooltrak.com,https://app.skooltrak.com,https://store.skooltrak.com`

Adjust if you use different hostnames.

### GraphQL path

Both backends mount Apollo at **`/api/graphql`** (not `/graphql`). Frontends should use the same path when pointing at `https://api.skooltrak.com` or a reverse-proxied same-origin URL.

### Federation manifests

The shell loads **`federation.manifest.json`** and remote entry URLs. Those URLs are **baked at build time** for each environment. Rebuild `web-shell` (and remotes) when remote hostnames change (e.g. `app.` / `store.` subdomains).

### Frontend / proxy

If you keep **same-origin** API calls from the shell (e.g. `skooltrak.com/api/...` → backend), configure Cloudflare or a Worker to route **`/api/*`** to `dashboard-backend`. If clients call **`https://api.skooltrak.com/api/graphql`** directly, ensure CORS and cookies (if any) match your auth setup.

## Phase 4: Domain Configuration

### 4.1 Railway Custom Domains

| Service | Suggested domain |
|---------|------------------|
| web-shell | skooltrak.com |
| web-dashboard | app.skooltrak.com |
| web-store | store.skooltrak.com |
| web-admin | admin.skooltrak.com |
| dashboard-backend | api.skooltrak.com |
| admin-backend | api-admin.skooltrak.com |

### 4.2 Cloudflare DNS

1. Add your domain to Cloudflare
2. Create CNAME (or Railway-provided targets) for:
   - `skooltrak.com` → Railway **web-shell**
   - `app` → Railway **web-dashboard** (remote)
   - `store` → Railway **web-store** (remote)
   - `admin` → Railway **web-admin**
   - `api` → Railway **dashboard-backend**
   - `api-admin` → Railway **admin-backend**

### 4.3 Reverse proxy and federation

- **Same-origin API:** route `/api/*` on the shell domain to **dashboard-backend** (Worker or Cloudflare rules).
- **Federation:** the shell origin must be able to fetch remote **JS bundles** and **manifest** from `app.` / `store.` hosts. Ensure **CORS** on those static hosts if the browser loads them cross-origin, and that HTTPS certificates cover all hostnames.

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
3. For **six** services, either:
   - Use **Railway Git integration** so each service builds and deploys from the same repo with its own `RAILWAY_DOCKERFILE_PATH`, or
   - Maintain **separate CI jobs / tokens** per service, or run `railway up` with the correct service context per deployment

### Automatic deploy via Railway

1. Connect the **GitHub** repo in Railway
2. Each service uses its Dockerfile path from the monorepo root
3. Configure branch triggers (e.g. `main`) per service

## Phase 6: Local Docker Verification

Test images locally before deploying (from repository root):

```bash
# dashboard-backend (GraphQL at http://localhost:3000/api/graphql)
docker build -f apps/dashboard-backend/Dockerfile -t skooltrak-dashboard-backend .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." skooltrak-dashboard-backend

# admin-backend
docker build -f apps/admin-backend/Dockerfile -t skooltrak-admin-backend .
docker run -p 5050:5050 -e DATABASE_URL="postgresql://..." skooltrak-admin-backend

# web-admin (Angular SSR)
docker build -f apps/web-admin/Dockerfile -t skooltrak-web-admin .
docker run -p 4300:4300 skooltrak-web-admin

# web-dashboard (federation SSR remote)
docker build -f apps/web-dashboard/Dockerfile -t skooltrak-web-dashboard .
docker run -p 4202:4202 skooltrak-web-dashboard

# web-shell (federation host, nginx)
docker build -f apps/web-shell/Dockerfile -t skooltrak-web-shell .
docker run -p 8080:80 skooltrak-web-shell

# web-store (federation remote, nginx)
docker build -f apps/web-store/Dockerfile -t skooltrak-web-store .
docker run -p 8081:80 skooltrak-web-store
```

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Railway (6 services) | ~$30–120 (usage varies) |
| Neon PostgreSQL (Pro) | $19 |
| Cloudflare R2 | ~$5 (usage-based) |
| Cloudflare CDN | Free tier |
| Resend | Free tier (3k emails/month) |
| **Total** | **~$54–144/month** (rough) |

## Troubleshooting

### Build fails with "Cannot find module '@generated/prisma'"

Ensure Prisma client is generated during the Docker build. Dockerfiles run `bunx prisma generate` before the Nx build. Backend images also copy `generated/` and link `node_modules/@generated/prisma` — keep that pattern if you add new Dockerfiles.

### Federation remote fails to load

- Confirm **`federation.manifest.json`** and remote **entry URLs** match deployed hostnames (HTTPS).
- Check **CORS** if remotes are on different origins than the shell.

### GraphQL 400 or CORS on `/api/graphql`

- Backends expose GraphQL at **`/api/graphql`**.
- Verify `CORS_ORIGINS` includes every browser origin that calls the API (shell + remotes + admin as applicable).

### CORS errors in production

Verify `CORS_ORIGINS` includes your frontend URLs (with `https://`). No trailing slashes.

### Database connection fails

- Check `DATABASE_URL` includes `?sslmode=require` for Neon
- Neon typically allows connections from cloud providers without IP allowlisting

### Frontend can't reach API

- **Same domain:** ensure the reverse proxy routes `/api` (or `/api/graphql`) to **dashboard-backend**
- **Subdomain API:** ensure Apollo client base URL includes `/api/graphql` and CORS is set on the backend

### `@generated/prisma` missing at runtime (backend)

Same as build-time: both NestJS Dockerfiles must keep Prisma `generated` output and the `@generated/prisma` symlink step; do not omit when customizing images.
