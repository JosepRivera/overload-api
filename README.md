<div align="center">

<!-- Place your logo at docs/logo.png -->
<img src="docs/logo.png" alt="Overload API Logo" width="120" />

# Overload API

[![NestJS](https://img.shields.io/badge/NestJS-v11.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white&labelColor=E0234E&color=2d2d2d)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3178C6&color=2d2d2d)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=4169E1&color=2d2d2d)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.4-2D3748?style=for-the-badge&logo=prisma&logoColor=white&labelColor=2D3748&color=2d2d2d)](https://www.prisma.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=339933&color=2d2d2d)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-29-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=2496ED&color=2d2d2d)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white&labelColor=F69220&color=2d2d2d)](https://pnpm.io/)
[![Biome](https://img.shields.io/badge/Biome-2.4-60A5FA?style=for-the-badge&logo=biome&logoColor=white&labelColor=60A5FA&color=2d2d2d)](https://biomejs.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=yellow&color=2d2d2d)](./LICENSE)

**REST API for advanced strength training tracking.**  
Manage workouts, sets, weights, personal records and training volume.

</div>

---

## Table of Contents

- [Overload API](#overload-api)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Tech Stack](#tech-stack)
  - [Features \& Roadmap](#features--roadmap)
  - [Project Architecture](#project-architecture)
  - [Database Schema](#database-schema)
  - [Environment Variables](#environment-variables)
  - [Installation \& Setup](#installation--setup)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
  - [Available Commands](#available-commands)
    - [Development](#development)
    - [Database](#database)
    - [Code Quality](#code-quality)
  - [API Documentation](#api-documentation)
  - [License](#license)

---

## Description

**Overload API** is the backend of a strength training application built around the principle of *progressive overload*: gradually increasing the training stimulus to drive continuous and measurable muscular adaptations.

Most gym apps are simple logs. This API goes further: it automatically calculates total training volume, detects new PRs the moment they happen, and estimates 1RM so athletes can plan their loads with data, not guesswork.

Built with **NestJS 11**, it exposes a REST API with JWT + Refresh Token authentication, a modular architecture, and full Docker support for both development and production.

---

## Tech Stack

**Core**

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)

**Database & ORM**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)

**Auth & Validation**

![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)
![Bcrypt](https://img.shields.io/badge/bcrypt-338?style=flat-square&logoColor=white)

**Infrastructure & Tooling**

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=flat-square&logo=biome&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white)

---

## Features & Roadmap

| ID   | Module                                                                                      | Status        |
| ---- | ------------------------------------------------------------------------------------------- | ------------- |
| F-01 | **Authentication** — Register, login, logout and JWT refresh tokens                         | ✅ Done        |
| F-02 | **Exercise Management** — Full CRUD for the user's personal exercise catalog                | 🚧 In progress |
| F-03 | **Routines** — Training plans with target sets, reps and rest times                         | 📋 Planned     |
| F-04 | **Workout Execution** — Real-time tracking of active training sessions                      | 📋 Planned     |
| F-05 | **Set Logging** — Weight and rep tracking with last-used weight history                     | 📋 Planned     |
| F-06 | **Training History** — Past sessions with advanced filters                                  | 📋 Planned     |
| F-07 | **Automatic PR Detection** — Algorithm that identifies new records instantly                | 📋 Planned     |
| F-08 | **Volume Calculation** — Total volume stats (weight × reps × sets) per session and exercise | 📋 Planned     |
| F-09 | **1RM Estimation** — One rep max calculation using the Epley formula                        | 📋 Planned     |

---

## Project Architecture

The project follows NestJS's modular architecture. Each business domain is encapsulated in its own module with an independent controller, service and DTOs. The Prisma client is generated into `generated/prisma` instead of `node_modules`, keeping it visible and under version control.

```
overload-api/
├── docs/                    # Project documentation (DB schema, features, logo)
├── generated/prisma/        # Auto-generated Prisma client — do not edit directly
├── prisma/
│   ├── migrations/          # Migration history
│   ├── schema.prisma        # Data model definition
│   └── seed.ts              # Initial data seed script
├── src/
│   ├── auth/                # F-01: Authentication (register, login, logout, refresh)
│   ├── jwt/                 # Internal JWT module: signing, verification and guard
│   ├── user/                # User management
│   ├── exercises/           # F-02: Personal exercise catalog CRUD
│   ├── routines/            # F-03: Training plan management
│   ├── workouts/            # F-04 & F-06: Workout execution and history
│   ├── sets/                # F-05: Individual set logging
│   ├── analytics/           # F-07, F-08 & F-09: PRs, volume and 1RM
│   ├── prisma/              # Global Prisma module, injectable across the app
│   ├── config/              # Environment variable validation with Zod
│   ├── types/               # Type extensions (Express, globals)
│   ├── app.module.ts        # Root module
│   └── main.ts              # Bootstrap: Swagger, Helmet, CORS, global pipes
├── docker-compose.yml       # Production environment
├── docker-compose.dev.yml   # Development environment with hot-reload
└── Dockerfile               # Multi-stage build (build → runner)
```

---

## Database Schema

The schema consists of seven tables. Derived metrics (volume, 1RM, PRs) are calculated on demand and never persisted.

![ER Diagram](docs/er-diagram.svg)

Key design decisions:

- **Access tokens are stateless** and never stored. Only refresh tokens are persisted, as a SHA-256 hash — never in plain text.
- **Exercises are never hard-deleted** if they have associated history. They are soft-deleted via `is_archived = TRUE`.
- **Warmup sets** (`is_warmup = TRUE`) are recorded but excluded from PR detection and volume calculations.
- A **workout** can exist without an associated routine to support spontaneous training sessions.

> The full schema with all columns, indexes and constraints is in [`docs/database-schema.md`](./docs/database-schema.md).

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

> `DATABASE_URL` is built automatically by Docker Compose from the PostgreSQL variables above. Only define it manually if running the app outside of Docker.

> **Never** commit your `.env` file to the repository. It is included in `.gitignore` by default.

---

## Installation & Setup

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- Node.js v22+ (only if running outside Docker)

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

**3. Start the development environment**

```bash
pnpm run dev
```

This starts two containers: `gymrat-postgres-dev` and `gymrat-app-dev`. The app runs in watch mode — any change in `src/` is reflected automatically. Pending migrations are applied on startup.

The API will be available at `http://localhost:3000`.

> Port `9229` is also exposed for connecting an external debugger (VS Code, Chrome DevTools).

---

## Available Commands

### Development

| Command              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `pnpm run dev`       | Start the development environment with Docker Compose |
| `pnpm run dev:build` | Rebuild images and start the environment              |
| `pnpm run dev:down`  | Stop and remove development containers                |
| `pnpm run dev:logs`  | Stream logs from `gymrat-app-dev` in real time        |
| `pnpm run shell`     | Open an interactive shell inside the container        |
| `pnpm run clean`     | Stop containers and remove volumes (deletes local DB) |

### Database

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `pnpm run db:migrate` | Create and apply a new migration in development   |
| `pnpm run db:gen`     | Regenerate the Prisma client after schema changes |
| `pnpm run db:studio`  | Open Prisma Studio (GUI for browsing the DB)      |
| `pnpm run db:seed`    | Run the seed script with sample data              |

### Code Quality

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm run lint`   | Lint and auto-fix code with Biome    |
| `pnpm run format` | Format code automatically with Biome |
| `pnpm run build`  | Compile TypeScript to `dist/`        |

---

## API Documentation

Once the server is running, the interactive Swagger documentation will be available at:

```
http://localhost:3000/api/docs
```

All endpoints, request/response schemas and examples are documented there. Protected endpoints require a Bearer Token — get one from `POST /auth/login` and paste it into the **Authorize** button in Swagger UI.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
