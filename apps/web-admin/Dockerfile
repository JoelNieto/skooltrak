# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client (needed for Angular build - some components import from @generated/prisma)
RUN bunx prisma generate

# Copy source code
COPY . .

# Build the Angular SSR application
RUN bun nx build web-admin --configuration=production

# Runtime stage - Node.js for Angular SSR (uses ES modules)
FROM node:20-slim
WORKDIR /app

# Copy built application (server + browser)
COPY --from=builder /app/dist/apps/web-admin/server ./server
COPY --from=builder /app/dist/apps/web-admin/browser ./browser

EXPOSE 4300
ENV PORT=4300

# Run the Angular SSR server
CMD ["node", "server/server.mjs"]
