<div align="center">

<img src="docs/assets/logo.png" alt="Overload API Logo" width="250" style="border-radius: 20px;" />

# Overload API

[![NestJS](https://img.shields.io/badge/NestJS-v11.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white&labelColor=E0234E&color=2d2d2d)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3178C6&color=2d2d2d)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=4169E1&color=2d2d2d)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.5-2D3748?style=for-the-badge&logo=prisma&logoColor=white&labelColor=2D3748&color=2d2d2d)](https://www.prisma.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=339933&color=2d2d2d)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-29-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=2496ED&color=2d2d2d)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white&labelColor=F69220&color=2d2d2d)](https://pnpm.io/)
[![Biome](https://img.shields.io/badge/Biome-2.4-60A5FA?style=for-the-badge&logo=biome&logoColor=white&labelColor=60A5FA&color=2d2d2d)](https://biomejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=for-the-badge&logo=vitest&logoColor=white&labelColor=6E9F18&color=2d2d2d)](https://vitest.dev/)
[![Zod](https://img.shields.io/badge/Zod-4.x-3E67B1?style=for-the-badge&logo=zod&logoColor=white&labelColor=3E67B1&color=2d2d2d)](https://zod.dev/)
[![Swagger](https://img.shields.io/badge/Swagger-UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black&labelColor=85EA2D&color=2d2d2d)](https://swagger.io/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white&labelColor=000000&color=2d2d2d)](https://jwt.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=yellow&color=2d2d2d)](./LICENSE)

**REST API for advanced strength training tracking.**  
Manage workouts, sets, weights, personal records and training volume.

</div>

---

## Table of Contents

- [Overload API](#overload-api)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Features \& Roadmap](#features--roadmap)
  - [Project Structure](#project-structure)
  - [Database Schema](#database-schema)
  - [Environment Variables](#environment-variables)
  - [Installation \& Setup](#installation--setup)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
  - [Common Workflows](#common-workflows)
    - [Adding or updating dependencies](#adding-or-updating-dependencies)
    - [Creating a database migration](#creating-a-database-migration)
  - [Available Commands](#available-commands)
    - [Development](#development)
    - [Database](#database)
    - [When to use each database command](#when-to-use-each-database-command)
    - [Tests](#tests)
    - [Code Quality](#code-quality)
  - [API Documentation](#api-documentation)

---

## Description

**Overload API** is the backend of a strength training application built around the principle of *progressive overload*: gradually increasing the training stimulus to drive continuous and measurable muscular adaptations.

Most gym apps are simple logs. This API goes further: it automatically calculates total training volume, detects new PRs the moment they happen, and estimates 1RM so athletes can plan their loads with data, not guesswork.

Built with **NestJS 11**, it exposes a REST API with JWT + Refresh Token authentication, a modular architecture, and full Docker support for development.

---

## Features & Roadmap

| Module                                                                                      | Status |
| ------------------------------------------------------------------------------------------- | ------ |
| **Authentication** — Register, login, logout and JWT refresh tokens                         | ✅ Done |
| **Exercise Management** — Full CRUD for the user's personal exercise catalog                | ✅ Done |
| **Routines** — Training plans with target sets, reps and rest times                         | ✅ Done |
| **Workout Execution** — Real-time tracking of active training sessions                      | ✅ Done |
| **Set Logging** — Weight and rep tracking with last-used weight history                     | ✅ Done |
| **Training History** — Past sessions with advanced filters                                  | ✅ Done |
| **Automatic PR Detection** — Algorithm that identifies new records instantly                | ✅ Done |
| **Volume Calculation** — Total volume stats (weight × reps × sets) per session and exercise | ✅ Done |
| **1RM Estimation** — One rep max calculation using the Epley formula                        | ✅ Done |

---

## Project Structure

```
overload-api/
├── docs/                    # Architecture, schema, decisions and assets
├── generated/prisma/        # Auto-generated Prisma client — do not edit directly
├── prisma/
│   ├── migrations/          # Migration history
│   ├── schema.prisma        # Data model definition
│   └── seed.ts              # Initial data seed script
├── src/
│   ├── auth/                # Authentication (register, login, logout, refresh)
│   ├── jwt/                 # JWT module: signing, verification and guard
│   ├── user/                # User management
│   ├── exercises/           # Personal exercise catalog CRUD
│   ├── routines/            # Training plan management
│   ├── workouts/            # Workout execution and history
│   ├── sets/                # Individual set logging
│   ├── analytics/           # PRs, volume and 1RM
│   ├── prisma/              # Global Prisma module
│   ├── config/              # Environment variable validation with Zod
│   ├── types/               # Type extensions
│   ├── app.module.ts        # Root module
│   └── main.ts              # Bootstrap: Swagger, Helmet, CORS, global pipes
├── test/                    # E2E test suites and helpers
├── docker-compose.yml       # Development environment with hot-reload
├── docker-compose.test.yml  # Isolated test environment
└── Dockerfile               # Development build stage
```

> Full architecture details in [`docs/architecture.md`](./docs/architecture.md).

---

## Database Schema

The schema consists of seven tables. Derived metrics (volume, 1RM, PRs) are calculated on demand and never persisted.

![ER Diagram](docs/assets/er-diagram.svg)

Key design decisions:

- **Access tokens are stateless** and never stored. Only refresh tokens are persisted as a SHA-256 hash — never in plain text.
- **Exercises are never hard-deleted** if they have associated history. They are soft-deleted via `is_archived = TRUE`.
- **Warmup sets** (`is_warmup = TRUE`) are recorded but excluded from PR detection and volume calculations.
- A **workout** can exist without an associated routine to support spontaneous training sessions.

> Full schema with all columns, indexes and constraints: [`docs/database-schema.md`](./docs/database-schema.md)

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

> `DATABASE_URL` is built automatically by Docker Compose. Only define it manually if running outside of Docker.

> **Never** commit your `.env` file. It is included in `.gitignore` by default.

---

## Installation & Setup

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- Node.js v24+ (only if running outside Docker)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/JosepRivera/overload-api.git
cd overload-api
```

**2. Set up environment variables**

```bash
cp .env.example .env
# Fill in your PostgreSQL credentials and JWT secrets
```

**3. Install dependencies locally** (optional, for IDE support)

```bash
pnpm install
```

**4. Start the development environment**

```bash
pnpm dev
```

This starts two containers: `overload-postgres-dev` and `overload-app-dev`. The app runs in watch mode — any change in `src/` is reflected automatically. Pending migrations are applied on startup.

- API: `http://localhost:3000`
- Debugger: port `9229` (VS Code / Chrome DevTools)

---

## Common Workflows

### Adding or updating dependencies

```bash
pnpm add <package-name>   # updates package.json and pnpm-lock.yaml
pnpm dev:build            # rebuilds the container with the new dependency
```

### Creating a database migration

```bash
# 1. Modify prisma/schema.prisma
# 2. Create and apply the migration
pnpm db:migrate
```

---

## Available Commands

### Development

| Command          | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `pnpm dev`       | Start the environment with Docker Compose                               |
| `pnpm dev:build` | Rebuild images and start (use after adding deps or changing Dockerfile) |
| `pnpm stop`      | Stop and remove development containers                                  |
| `pnpm shell`     | Open an interactive shell inside `overload-app-dev`                     |
| `pnpm clean`     | Stop containers and remove volumes — **wipes the database**             |

### Database

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `pnpm db:migrate` | Create and apply a new migration               |
| `pnpm db:reset`   | Reset the database and re-apply all migrations |
| `pnpm db:seed`    | Run the seed script with sample data           |
| `pnpm db:gen`     | Regenerate the Prisma client                   |

### When to use each database command

| Situation                          | Command                         |
| ---------------------------------- | ------------------------------- |
| Modified `schema.prisma`           | `pnpm db:migrate`               |
| Reset DB without wiping containers | `pnpm db:reset`                 |
| Conflicting migration history      | `pnpm db:reset`                 |
| Changed Dockerfile or dependencies | `pnpm dev:build`                |
| Wipe everything and start fresh    | `pnpm clean` → `pnpm dev:build` |

### Tests

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `pnpm test`          | Run unit tests                                  |
| `pnpm test:watch`    | Run unit tests in watch mode                    |
| `pnpm test:cov`      | Run unit tests with coverage report             |
| `pnpm test:e2e`      | Run e2e tests in Docker                         |
| `pnpm test:e2e:down` | Stop and remove e2e test containers and volumes |

### Code Quality

| Command      | Description                       |
| ------------ | --------------------------------- |
| `pnpm lint`  | Lint and auto-fix code with Biome |
| `pnpm build` | Compile TypeScript to `dist/`     |

---

## API Documentation

Once the server is running, the interactive Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

Protected endpoints require a Bearer Token — get one from `POST /auth/login` and paste it into the **Authorize** button in Swagger UI.

