# Build stage — federation SSR remote (web-dashboard).
# Serves the remote bundle + SSR; the web-shell host loads this app via federation.manifest.json at runtime.
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

# Needed for Angular build paths that import @generated/prisma
RUN bunx prisma generate

COPY . .

RUN bun nx build web-dashboard --configuration=production

# Runtime — Node for Angular SSR + native-federation-node (see apps/web-dashboard/src/server.ts)
FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/dist/apps/web-dashboard/server ./server
COPY --from=builder /app/dist/apps/web-dashboard/browser ./browser

EXPOSE 4202
ENV PORT=4202

CMD ["node", "server/server.mjs"]
