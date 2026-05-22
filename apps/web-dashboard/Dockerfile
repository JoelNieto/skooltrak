# Build stage — Angular dashboard with SSR.
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

# Needed for Angular build paths that import @generated/prisma
RUN bunx prisma generate

COPY . .

RUN bun nx build web-dashboard --configuration=production

# Runtime — Node for Angular SSR
FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/dist/apps/web-dashboard/server ./server
COPY --from=builder /app/dist/apps/web-dashboard/browser ./browser

EXPOSE 4200
ENV PORT=4200

CMD ["node", "server/server.mjs"]
