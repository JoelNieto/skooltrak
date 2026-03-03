# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bunx prisma generate

# Copy source code
COPY . .

# Build the application
RUN bun nx build dashboard-backend --configuration=production

# Runtime stage
FROM oven/bun:1-slim
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/apps/dashboard-backend ./

# Copy Prisma schema and generated client (required for runtime)
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

# Create node_modules structure for @generated/prisma resolution
RUN mkdir -p node_modules/@generated && ln -sf /app/generated/prisma node_modules/@generated/prisma

# Install production dependencies only
RUN bun install --production

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "main.js"]
