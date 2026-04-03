# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate
WORKDIR /app

# ─── Dev stage ────────────────────────────────────────
FROM base AS dev
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prisma generate
COPY . .

# ─── Build stage ──────────────────────────────────────
FROM base AS build
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prisma generate
COPY . .
RUN pnpm build

# ─── Production stage ─────────────────────────────────
FROM base AS prod
ENV NODE_ENV=production

# Copy all node_modules from build (includes prisma CLI needed for migrate deploy)
COPY --from=build /app/node_modules ./node_modules
# Copy generated Prisma client
COPY --from=build /app/src/generated ./src/generated
# Copy compiled application bundle
COPY --from=build /app/dist ./dist
# Copy package manifest and prisma schema (required by prisma migrate deploy)
COPY package.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
