# Build stage — federation host (CSR); remotes resolve via public federation manifest at runtime.
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

RUN bunx prisma generate

COPY . .

RUN bun nx build web-shell --configuration=production

FROM nginx:alpine
COPY apps/web-shell/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/web-shell/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
