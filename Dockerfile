# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Vite bakes VITE_* vars into the JS bundle at build time
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_AWS_REGION
ARG VITE_S3_BUCKET_NAME
ARG VITE_S3_LEGAL_DOCS_BUCKET_NAME

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_AWS_REGION=$VITE_AWS_REGION
ENV VITE_S3_BUCKET_NAME=$VITE_S3_BUCKET_NAME
ENV VITE_S3_LEGAL_DOCS_BUCKET_NAME=$VITE_S3_LEGAL_DOCS_BUCKET_NAME

RUN pnpm --filter @knowlex/web build

# ─────────────────────────────────────────────
# Stage 2: Serve
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# GKE/non-root: nginx listens on 8080 (unprivileged port)
RUN sed -i 's/user  nginx;//g' /etc/nginx/nginx.conf && \
    sed -i 's|pid[[:space:]]*/[^;]*nginx\.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
# Ensure nginx user can read built files (COPY leaves them root-owned)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Run as non-root
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
