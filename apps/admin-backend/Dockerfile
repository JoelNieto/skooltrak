# Build stage. Node runs the build, as in CI: under the Bun runtime Angular's SSR route
# extraction fails ("An error occurred while extracting routes"). Bun is only the package
# manager, pinned to the version CI uses.
FROM node:24-slim AS builder
COPY --from=oven/bun:1.2.22 /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
WORKDIR /app

# prisma.config.ts reads DATABASE_URL and throws when it is unset. `prisma generate` never
# connects, so a placeholder is enough here; the real URL is only given to the running container.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=$DATABASE_URL

COPY package.json bun.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tools ./tools/

RUN bun install --frozen-lockfile
RUN bunx prisma generate

COPY . .

RUN bun nx build admin-backend --configuration=production

# Runtime stage
FROM oven/bun:1.2-slim
WORKDIR /app

COPY --from=builder /app/dist/apps/admin-backend ./

# Prisma schema and generated client (required at runtime)
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

# @generated/prisma resolves through node_modules
RUN mkdir -p node_modules/@generated && ln -sf /app/generated/prisma node_modules/@generated/prisma

RUN bun install --production

ENV NODE_ENV=production
ENV PORT=5050
EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://localhost:5050/api').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "main.js"]
