# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────
# 1) deps — install dependencies. better-sqlite3 is a native module, so we
#    need python3 / make / g++ to build it during npm install.
# ─────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────
# 2) builder — compile Next.js. Needs the env vars baked into the client
#    bundle (NEXT_PUBLIC_*) at build time.
# ─────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────
# 3) runner — minimal runtime image. Uses Next.js standalone output so the
#    image stays small and doesn't need the full source tree.
# ─────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone build output + static assets + public.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Persistent directories: SQLite DB + user-uploaded photos. Compose mounts
# host volumes here so data survives container rebuilds.
RUN mkdir -p ./data ./public/places ./public/friends \
    && chown -R nextjs:nodejs ./data ./public/places ./public/friends

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
