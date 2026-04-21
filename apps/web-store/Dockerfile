# Build stage — federation remote (CSR); served as static assets for the web-shell host.
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

RUN bunx prisma generate

COPY . .

RUN bun nx build web-store --configuration=production

FROM nginx:alpine
COPY apps/web-store/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/web-store/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
