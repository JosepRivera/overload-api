---
title: Deploy to production
description: What the production image contains today, and what still has to be decided before this API can be deployed.
draft: false
---

:::caution[This page is a draft]
The production Docker image exists and builds, but **the API has not been deployed anywhere yet** and no hosting target has been chosen. What follows documents what is already in place and flags what is still missing.

Do not treat this as a deployment runbook until the open questions at the bottom are answered.
:::

## What already exists

The [`Dockerfile`](https://github.com/JosepRivera/overload-server/blob/main/Dockerfile) is multi-stage and already has a production target that is separate from the development one.

| Stage       | Purpose                                                       |
| ----------- | ------------------------------------------------------------- |
| `base`      | `node:24-alpine` with pnpm enabled via corepack               |
| `deps`      | Full dependency install, shared by `dev` and `build`          |
| `dev`       | Used by Docker Compose for local development with hot reload  |
| `build`     | Runs `prisma generate` and compiles TypeScript to `dist/`     |
| `prod-deps` | Production-only install — no devDependencies                  |
| `prod`      | Final runtime image                                           |

Build the production image:

```bash
docker build --target prod -t overload-api:latest .
```

The resulting image runs `node dist/main.js`, exposes port `3000`, and sets `NODE_ENV=production`. It contains only the compiled output, the generated Prisma client, production dependencies, and the Prisma schema — no source, no dev tooling.

## Required environment variables

The production container needs every variable the API validates at boot. Unlike development, `DATABASE_URL` is **not** assembled for you — Compose does that locally, and there is no Compose in production.

| Variable                | Notes for production                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`          | Full PostgreSQL connection string. Must be supplied explicitly.          |
| `PORT`                  | The container exposes `3000`; match it or map it.                        |
| `NODE_ENV`              | `production`                                                             |
| `JWT_SECRET`            | Must be a strong, unique secret — never the development value.           |
| `JWT_ACCESS_TOKEN_TTL`  | `15m`                                                                    |
| `JWT_REFRESH_TOKEN_TTL` | `7d`                                                                     |
| `CORS_ORIGIN`           | The real frontend origin. A wildcard here defeats the CORS policy.       |
| `BCRYPT_ROUNDS`         | `10` or higher. Lower values are for tests only.                         |

## Running migrations

The development stack runs `prisma migrate deploy` automatically on startup. **The production image does not** — its command goes straight to `node dist/main.js`.

Migrations must therefore run as a deliberate step before the new version starts serving traffic:

```bash
pnpm prisma migrate deploy
```

How that step is wired — an init container, a release command, a CI job — depends on the hosting platform, which has not been chosen yet.

## Open questions

These block a real deployment and are not yet decided:

- **Hosting target.** Container platform, PaaS or VM? This determines how migrations, secrets and health checks are wired.
- **Database hosting.** Managed PostgreSQL 18, or self-hosted? Backups and point-in-time recovery are undefined.
- **Health check endpoint.** The API exposes no `/health` route, so no orchestrator can currently tell whether it is alive. Note that in `compose.yaml` the Postgres service has a healthcheck and the API service does not.
- **Secret management.** Where `JWT_SECRET` and the database credentials come from at runtime.
- **Expired token cleanup.** [ADR 0005](/architecture/business-rules/) assumes a scheduled job removes expired refresh tokens. No such job exists yet.
- **Logging and observability.** No structured logging or error reporting is configured.
- **Rate limiting.** `/auth/login` currently accepts unlimited attempts. This should not be publicly exposed without a limiter in front of it.

:::note[Contributing to this page]
When the hosting target is chosen, replace this section with the real deployment steps and delete the draft banner above.
:::
