<div align="center">

<img src="apps/docs/src/assets/logo.png" alt="Overload Logo" width="250" style="border-radius: 20px;" />

# Overload

[![NestJS](https://img.shields.io/badge/NestJS-11.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white&labelColor=E0234E&color=2d2d2d)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3178C6&color=2d2d2d)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=339933&color=2d2d2d)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=4169E1&color=2d2d2d)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma&logoColor=white&labelColor=2D3748&color=2d2d2d)](https://www.prisma.io/)
[![Zod](https://img.shields.io/badge/Zod-4.4-3E67B1?style=for-the-badge&logo=zod&logoColor=white&labelColor=3E67B1&color=2d2d2d)](https://zod.dev/)
[![jose](https://img.shields.io/badge/jose-6.2-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white&labelColor=000000&color=2d2d2d)](https://github.com/panva/jose)
[![Docker](https://img.shields.io/badge/Docker-29-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=2496ED&color=2d2d2d)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/pnpm-11.18-F69220?style=for-the-badge&logo=pnpm&logoColor=white&labelColor=F69220&color=2d2d2d)](https://pnpm.io/)
[![Biome](https://img.shields.io/badge/Biome-2.5-60A5FA?style=for-the-badge&logo=biome&logoColor=white&labelColor=60A5FA&color=2d2d2d)](https://biomejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=for-the-badge&logo=vitest&logoColor=white&labelColor=6E9F18&color=2d2d2d)](https://vitest.dev/)
[![Scalar](https://img.shields.io/badge/Scalar-1.2-5865F2?style=for-the-badge&logo=scalar&logoColor=white&labelColor=5865F2&color=2d2d2d)](https://scalar.com/)
[![Astro](https://img.shields.io/badge/Astro-7.1-BC52EE?style=for-the-badge&logo=astro&logoColor=white&labelColor=BC52EE&color=2d2d2d)](https://astro.build/)
[![Starlight](https://img.shields.io/badge/Starlight-0.41-BC52EE?style=for-the-badge&logo=astro&logoColor=white&labelColor=6D28D9&color=2d2d2d)](https://starlight.astro.build/)

**Track strength training as data, not as a notebook.**

</div>

---

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Environment Variables](#environment-variables)
- [Installation \& Setup](#installation--setup)
- [Available Commands](#available-commands)
- [Documentation](#documentation)

---

## Description

Most training apps are glorified notebooks: you write down what you lifted, and the numbers just sit there. Knowing whether you actually progressed is left to you and your memory.

**Overload** turns every logged set into a measurement. It adds up the real volume you moved, catches a personal record the instant it happens, and estimates your one rep max — so the next load is a decision backed by numbers instead of a guess.

It is built around one idea: **progressive overload**. If the stimulus does not increase over time, neither does the adaptation — and you cannot increase what you never measured.

---

## Features

**Training**

- Your own exercise catalog, organized by muscle group and movement type
- Reusable routines with target sets, reps and rest times, in the order you train them
- Live sessions you start, log and finish — following a routine or improvising
- Every set recorded with its weight and reps, warmups kept apart from the real work
- Complete training history, filterable

**Progress**

- New personal records flagged the moment you hit them
- Total volume moved, per session and per exercise
- Estimated one rep max, so you know what you can handle before you try it
- Exercise-by-exercise progression over time

**Your data**

- Secure sign-in, with up to five devices logged in at once
- Nothing disappears silently — an exercise you stop doing gets archived, never erased

> How each of these works — endpoints, business rules and the reasoning behind every decision — lives in the [documentation site](#documentation).

---

## Environment Variables

Copy the example file before starting:

```bash
cp .env.example .env
```

| Variable                | Description                          | Default / Example       |
| ----------------------- | ------------------------------------ | ----------------------- |
| `POSTGRES_USER`         | PostgreSQL username                  | `overload_user`         |
| `POSTGRES_PASSWORD`     | PostgreSQL password                  | —                       |
| `POSTGRES_DB`           | Database name                        | `overload_db`           |
| `POSTGRES_PORT`         | PostgreSQL port exposed on the host  | `5432`                  |
| `PORT`                  | Port the API listens on              | `3000`                  |
| `NODE_ENV`              | Runtime environment                  | `development`           |
| `JWT_SECRET`            | Secret key for signing access tokens | —                       |
| `JWT_ACCESS_TOKEN_TTL`  | Access token duration                | `15m`                   |
| `JWT_REFRESH_TOKEN_TTL` | Refresh token duration               | `7d`                    |
| `CORS_ORIGIN`           | Allowed CORS origin                  | `http://localhost:5173` |
| `BCRYPT_ROUNDS`         | bcrypt hashing rounds                | `10`                    |

> `DATABASE_URL` is assembled by Docker Compose from the `POSTGRES_*` values. Only define it manually when running outside Docker.

---

## Installation & Setup

### Prerequisites

- [Docker](https://www.docker.com/) 29+ with Compose
- [pnpm](https://pnpm.io/) 11+ — `npm install -g pnpm`
- Node.js 24 (only if running outside Docker)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/JosepRivera/overload-server.git
cd overload-server
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

**3. Start the environment**

```bash
pnpm dev:build
```

Use `dev:build` on the first run — it installs dependencies and builds the images. From then on, `pnpm dev` is enough.

This starts three containers — `overload-postgres-dev`, `overload-app-dev` and `overload-docs-dev`. The API runs in watch mode, and pending migrations are applied automatically on startup.

| Service              | URL                              |
| -------------------- | -------------------------------- |
| API                  | `http://localhost:3000`          |
| Interactive API ref  | `http://localhost:3000/api/docs` |
| Documentation site   | `http://localhost:4321`          |
| PostgreSQL           | `localhost:5432`                 |
| Node.js debugger     | `localhost:9229`                 |

---

## Available Commands

### Environment

| Command          | Description                                          | Use it when                              |
| ---------------- | ---------------------------------------------------- | ---------------------------------------- |
| `pnpm dev`       | Start the full stack with Docker Compose             | Day-to-day development                   |
| `pnpm dev:build` | Reinstall dependencies and rebuild images            | After adding a dep or editing Dockerfile |
| `pnpm dev:stop`  | Stop and remove containers                           | Done for the day — database is preserved |
| `pnpm dev:clean` | Stop containers and drop volumes — **wipes the DB**  | Starting completely from scratch         |

### Database

| Command                            | Description                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `pnpm db:migrate <migration-name>` | Create and apply a migration after editing the schema  |
| `pnpm db:seed`                     | Load sample data into the running dev container        |
| `pnpm db:reset`                    | Drop the database and replay every migration           |

### Tests

| Command              | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `pnpm test`          | Unit tests (`src/**/__tests__/**/*.spec.ts`)                   |
| `pnpm test:e2e`      | E2E suite in an isolated Postgres container on port `5433`     |
| `pnpm test:e2e:down` | Tear down the E2E containers and their volumes                 |

### Build & Quality

| Command             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `pnpm build`        | Compile the API to `dist/`                             |
| `pnpm lint`         | Lint and auto-fix `src/` and `test/` with Biome        |
| `pnpm start`        | Run the API in watch mode outside Docker               |
| `pnpm docs:build`   | Build the static documentation site                    |
| `pnpm docs:preview` | Serve the built documentation site                     |

---

## Documentation

| Docs                        | What's there                                                        | URL                                                              |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Documentation site**      | Architecture, database schema, business rules and decision records  | [`http://localhost:4321`](http://localhost:4321)                 |
| **Interactive API reference** | Every endpoint, with live requests against your local server       | [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) |

Both come up with `pnpm dev`. Protected endpoints need a Bearer Token — get one from `POST /auth/login` and paste it into the **Authorize** button in the API reference.
