# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable
WORKDIR /app

# ─── Full deps (dev + prod) — used by dev & build stages ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ─── Dev stage (local dev via compose) ─────────────────────
FROM deps AS dev
COPY . .

# ─── Build stage (compile TypeScript) ──────────────────────
FROM deps AS build
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# ─── Production-only deps (no devDependencies) ─────────────
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ─── Production image ──────────────────────────────────────
FROM node:24-alpine AS prod
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
