# Build stage
FROM oven/bun:1.2 AS builder
WORKDIR /app

# prisma.config.ts reads DATABASE_URL and throws when it is unset; `prisma generate` never connects.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=$DATABASE_URL

COPY package.json bun.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tools ./tools/

RUN bun install --frozen-lockfile
# Some Angular code imports types from @generated/prisma
RUN bunx prisma generate

COPY . .

RUN bun nx build web-dashboard --configuration=production

# Runtime: Node for Angular SSR (Angular 22 needs Node ^22.22.3 || ^24.15.0)
FROM node:24-slim
WORKDIR /app

COPY --from=builder /app/dist/apps/web-dashboard/server ./server
COPY --from=builder /app/dist/apps/web-dashboard/browser ./browser

ENV NODE_ENV=production
ENV PORT=4200
EXPOSE 4200

# Any answer below 500 means the server is up (a host outside NG_ALLOWED_HOSTS gets a 4xx).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:4200/').then((r) => process.exit(r.status < 500 ? 0 : 1)).catch(() => process.exit(1))"

USER node
CMD ["node", "server/server.mjs"]
