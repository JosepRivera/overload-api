# 0004 — PostgreSQL over MongoDB

## Status
Accepted

## Date
2026-03-08

## Context
The core data of this application — users, workouts, sets, exercises, routines — has clearly defined relationships and a predictable, structured shape. The choice of database engine has a direct impact on data integrity, query complexity, and long-term maintainability.

## Decision
Use **PostgreSQL** as the primary database.

## Alternatives Considered
- **MongoDB** — flexible schema, good for unstructured or highly variable data. However, the data model here is inherently relational: a workout belongs to a user, sets belong to a workout and reference an exercise. Modeling this in MongoDB would require manual referential integrity at the application layer.
- **MySQL / MariaDB** — solid relational option, but PostgreSQL has better support for advanced types (JSONB, INET, TIMESTAMPTZ) and stronger standards compliance.
- **SQLite** — good for local development but not suitable for a deployed multi-user API.

## Consequences
**Positive:**
- Native referential integrity via foreign keys and cascades — no orphaned records.
- `TIMESTAMPTZ` for all date columns — timezone-aware from day one.
- `INET` type for storing IP addresses natively (used in `refresh_tokens`).
- Complex analytics queries (volume, PRs, 1RM) are straightforward with SQL aggregations.
- Partial indexes for performance-critical queries (active workouts, active exercises, valid tokens).

**Negative:**
- Rigid schema — adding or changing columns requires migrations.
- Slightly more operational overhead than MongoDB for simple key-value access patterns.