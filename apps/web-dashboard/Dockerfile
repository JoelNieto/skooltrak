# Build stage — federation host (CSR) + API consumers resolve remotes via public federation manifest.
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

# Build the shell (static); remotes are loaded at runtime from federation.manifest.json
RUN bun nx build web-shell --configuration=production

FROM nginx:alpine
COPY apps/web-shell/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/web-shell/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
