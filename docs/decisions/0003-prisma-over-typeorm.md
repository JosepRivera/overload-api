# 0003 — Prisma over TypeORM

## Status
Accepted

## Date
2026-03-08

## Context
NestJS has first-class support for both TypeORM and Prisma. TypeORM is the historically dominant ORM in the NestJS ecosystem. Prisma is newer but has gained significant traction due to its developer experience and type safety model.

The project requires reliable migrations, strong TypeScript integration, and a clear schema-first workflow.

## Decision
Use **Prisma** as the ORM.

## Alternatives Considered
- **TypeORM** — native NestJS integration, decorator-based entities, Active Record and Data Mapper patterns. However, TypeScript types are not always accurate at runtime, and migrations can be unpredictable.
- **Drizzle ORM** — very lightweight and SQL-first, but smaller ecosystem and less mature tooling at the time of this decision.
- **Kysely** — excellent type safety but a query builder, not a full ORM — no migrations or schema management.
- **Raw SQL with pg** — full control but no type safety and significant boilerplate.

## Consequences
**Positive:**
- Auto-generated TypeScript client from `schema.prisma` — types are always in sync with the database.
- Predictable and explicit migrations — no surprise schema diffs.
- Prisma Studio for visual database inspection during development.
- Clear schema definition as a single source of truth.

**Negative:**
- Generated client must be regenerated after every schema change (`prisma generate`).
- Less flexible for highly complex raw SQL queries — requires `$queryRaw` escape hatch.
- Client is generated into `generated/prisma` instead of `node_modules` to keep it visible and version-controlled.