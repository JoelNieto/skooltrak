# Skooltrak Platform - Deployment Guide

This guide covers deploying the Skooltrak platform to Railway with Neon PostgreSQL, Cloudflare R2, and Resend.

## Architecture Overview

```
                    Cloudflare (DNS, CDN)
                            |
        +-------------------+-------------------+
        |                   |                   |
   web-dashboard      web-admin         api.skooltrak.com
   (Angular SSR)      (Angular SSR)      api-admin.skooltrak.com
        |                   |                   |
        +-------------------+-------------------+
                            |
                    Railway (4 services)
                            |
        +-------------------+-------------------+
        |                   |                   |
   Neon PostgreSQL    Cloudflare R2       Resend
   (Database)         (File Storage)      (Email)
```

## Prerequisites

- [Railway](https://railway.app) account
- [Neon](https://neon.tech) account (PostgreSQL)
- [Cloudflare](https://cloudflare.com) account (R2, DNS)
- [Resend](https://resend.com) account (Email)
- Domain name (e.g., skooltrak.com)

## Phase 1: Database Setup

### 1.1 Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Select **AWS São Paulo (sa-east-1)** region for LATAM
4. Copy the connection string (add `?sslmode=require` if not present)

### 1.2 Run Migrations

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Run migrations
bunx prisma migrate deploy

# Seed initial admin (optional)
bun run prisma/scripts/seed-admin.ts
```

## Phase 2: Railway Setup

### 2.1 Create Railway Project

1. Create a new project at [Railway](https://railway.app/new)
2. Add 4 services: `dashboard-backend`, `admin-backend`, `web-dashboard`, `web-admin`

### 2.2 Configure Each Service

For each service, set in Railway dashboard:

| Setting | dashboard-backend | admin-backend | web-dashboard | web-admin |
|---------|-------------------|---------------|--------------|-----------|
| Root Directory | `/` (empty) | `/` (empty) | `/` (empty) | `/` (empty) |
| Dockerfile Path | `apps/dashboard-backend/Dockerfile` | `apps/admin-backend/Dockerfile` | `apps/web-dashboard/Dockerfile` | `apps/web-admin/Dockerfile` |

**Via Environment Variable:** Set `RAILWAY_DOCKERFILE_PATH` per service:
- `apps/dashboard-backend/Dockerfile`
- `apps/admin-backend/Dockerfile`
- etc.

### 2.3 Connect Repository

- Connect your GitLab/GitHub repo to Railway
- Railway will auto-deploy on push to main (or configure branch)
- Or use manual deploy via GitLab CI (see Phase 5)

## Phase 3: Environment Variables

Configure these in Railway for each service:

### Backend Services (dashboard-backend, admin-backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon connection string | `postgresql://...?sslmode=require` |
| `BETTER_AUTH_SECRET` | Auth secret | `openssl rand -base64 32` |
| `JWT_SECRET` | JWT signing secret | Same as BETTER_AUTH_SECRET |
| `APP_URL` | Public app URL | `https://skooltrak.com` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://skooltrak.com,https://admin.skooltrak.com` |
| `TRUSTED_ORIGINS` | Better-auth trusted origins | Same as CORS_ORIGINS |
| `CLOUDFLARE_R2_ENDPOINT` | R2 endpoint URL | From Cloudflare R2 |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key | From Cloudflare R2 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret | From Cloudflare R2 |
| `CLOUDFLARE_R2_BUCKET` | R2 bucket name | Your bucket name |
| `RESEND_API_KEY` | Resend API key | From Resend dashboard |
| `EMAIL_FROM` | From email | `Skooltrak <noreply@skooltrak.com>` |

### admin-backend CORS

Set `CORS_ORIGINS` to `https://admin.skooltrak.com` (web-admin origin).

### dashboard-backend CORS

Set `CORS_ORIGINS` to `https://skooltrak.com` (web-dashboard origin).

### Frontend Services (web-dashboard, web-admin)

Frontends use relative `/api` URLs. Configure a reverse proxy (Cloudflare) to route:
- `skooltrak.com/api` → dashboard-backend
- `admin.skooltrak.com/api` → admin-backend

Or set `PORT` if Railway assigns a different port.

## Phase 4: Domain Configuration

### 4.1 Railway Custom Domains

In each Railway service, add custom domain:

| Service | Domain |
|---------|--------|
| web-dashboard | skooltrak.com |
| web-admin | admin.skooltrak.com |
| dashboard-backend | api.skooltrak.com |
| admin-backend | api-admin.skooltrak.com |

### 4.2 Cloudflare DNS

1. Add your domain to Cloudflare
2. Create CNAME records pointing to Railway:
   - `skooltrak.com` → (Railway web-dashboard URL)
   - `admin` → (Railway web-admin URL)
   - `api` → (Railway dashboard-backend URL)
   - `api-admin` → (Railway admin-backend URL)

### 4.3 Reverse Proxy for Same-Origin API

To keep frontends using relative `/api` URLs, use Cloudflare Workers or a proxy:

**Option A: Cloudflare Worker** – Route `/api/*` from skooltrak.com to api.skooltrak.com

**Option B: Separate subdomains** – Update frontend to use `https://api.skooltrak.com` for API calls (requires code changes)

## Phase 5: CI/CD (GitLab)

### 5.1 Manual Deploy via GitLab

1. Add `RAILWAY_TOKEN` to GitLab CI/CD variables (Settings → CI/CD → Variables)
   - Get token from Railway: Project Settings → Tokens
   - Mark as masked for security
2. Link your local project: `railway link` (select project and default service)
3. The deploy job runs manually after CI passes on main
4. Click "Play" on the deploy job to trigger deployment

**Note:** The deploy job deploys the linked service. For multiple services, run `railway up` separately for each, or use Railway's Git integration for automatic deploys.

### 5.2 Automatic Deploy via Railway

1. In Railway, connect your GitLab repo
2. Each service builds from the same repo with its Dockerfile path
3. Pushes to main trigger builds for all services

## Phase 6: Local Docker Verification

Test builds locally before deploying:

```bash
# Build and run dashboard-backend
docker build -f apps/dashboard-backend/Dockerfile -t skooltrak-dashboard-backend .
docker run -p 3000:3000 -e DATABASE_URL="..." skooltrak-dashboard-backend

# Build and run web-dashboard
docker build -f apps/web-dashboard/Dockerfile -t skooltrak-web-dashboard .
docker run -p 4200:4200 skooltrak-web-dashboard
```

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Railway (4 services) | $20-80 |
| Neon PostgreSQL (Pro) | $19 |
| Cloudflare R2 | ~$5 (usage-based) |
| Cloudflare CDN | Free |
| Resend | Free tier (3k emails/month) |
| **Total** | **$44-104/month** |

## Troubleshooting

### Build fails with "Cannot find module '@generated/prisma'"

Ensure Prisma client is generated during the Docker build. The Dockerfile runs `bunx prisma generate` before the Nx build.

### CORS errors in production

Verify `CORS_ORIGINS` includes your frontend URLs (with `https://`). No trailing slashes.

### Database connection fails

- Check `DATABASE_URL` includes `?sslmode=require` for Neon
- Verify Neon allows connections from Railway IPs (Neon typically allows all)

### Frontend can't reach API

- If using same domain: ensure reverse proxy routes `/api` to the backend
- If using subdomains: update frontend to use full API URL (requires app config changes)
