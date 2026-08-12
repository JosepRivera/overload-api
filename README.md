<div align="center">

<img src="apps/docs/src/assets/logo.png" alt="Overload Logo" width="250"/>

# Overload

[![NestJS](https://img.shields.io/badge/NestJS-11.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white&labelColor=E0234E&color=2d2d2d)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3178C6&color=2d2d2d)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=339933&color=2d2d2d)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=4169E1&color=2d2d2d)](https://www.postgresql.org/)
[![Neon](https://img.shields.io/badge/Neon-DB-00E599?style=for-the-badge&logo=neon&logoColor=white&labelColor=00E599&color=2d2d2d)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma&logoColor=white&labelColor=2D3748&color=2d2d2d)](https://www.prisma.io/)
[![Zod](https://img.shields.io/badge/Zod-4.4-3E67B1?style=for-the-badge&logo=zod&logoColor=white&labelColor=3E67B1&color=2d2d2d)](https://zod.dev/)
[![jose](https://img.shields.io/badge/jose-6.2-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white&labelColor=000000&color=2d2d2d)](https://github.com/panva/jose)
[![Docker](https://img.shields.io/badge/Docker-29-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=2496ED&color=2d2d2d)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/pnpm-11.21-F69220?style=for-the-badge&logo=pnpm&logoColor=white&labelColor=F69220&color=2d2d2d)](https://pnpm.io/)
[![Biome](https://img.shields.io/badge/Biome-2.5-60A5FA?style=for-the-badge&logo=biome&logoColor=white&labelColor=60A5FA&color=2d2d2d)](https://biomejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=for-the-badge&logo=vitest&logoColor=white&labelColor=6E9F18&color=2d2d2d)](https://vitest.dev/)
[![Scalar](https://img.shields.io/badge/Scalar-1.2-5865F2?style=for-the-badge&logo=scalar&logoColor=white&labelColor=5865F2&color=2d2d2d)](https://scalar.com/)
[![Astro](https://img.shields.io/badge/Astro-7.2-BC52EE?style=for-the-badge&logo=astro&logoColor=white&labelColor=BC52EE&color=2d2d2d)](https://astro.build/)
[![Starlight](https://img.shields.io/badge/Starlight-0.41-BC52EE?style=for-the-badge&logo=astro&logoColor=white&labelColor=6D28D9&color=2d2d2d)](https://starlight.astro.build/)
[![Render](https://img.shields.io/badge/Render-Live-white?style=for-the-badge&logo=render&logoColor=black&labelColor=white&color=2d2d2d)](https://overload-server.onrender.com)
[![Vercel](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000000&color=2d2d2d)](https://overload-server-docs.vercel.app)

**Track strength training as data, not as a notebook.**

</div>

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
pnpm dev
```

This starts three containers — `overload-postgres-dev`, `overload-app-dev` and `overload-docs-dev`. The API runs in watch mode, and pending migrations are applied automatically on startup.

---

## Documentation

| Docs                        | What's there                                                        | URL                                                              |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Documentation site**      | Architecture, database schema, business rules and decision records  | [overload-server-docs.vercel.app](https://overload-server-docs.vercel.app) (local: [`http://localhost:4321`](http://localhost:4321)) |
| **Interactive API reference** | Every endpoint, with live requests against your local server       | [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) |
