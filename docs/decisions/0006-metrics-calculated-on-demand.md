# 0006 — Metrics Calculated On-Demand, Never Persisted

## Status
Accepted

## Date
2026-03-08

## Context
The application tracks three derived metrics per workout and exercise:
- **Total volume** — `SUM(weight × reps)` for all non-warmup sets
- **Personal Records (PRs)** — maximum weight and maximum `weight × reps` per exercise
- **1RM estimate** — `weight × (1 + reps / 30.0)` using the Epley formula

These metrics could be pre-computed and stored in dedicated tables, updated on every set insertion, or calculated dynamically on each request.

## Decision
All derived metrics are **calculated on-demand** at query time. No metric values are persisted in the database.

## Alternatives Considered
- **Materialized views** — auto-updated by the database engine, but adds schema complexity and potential staleness depending on refresh strategy.
- **Denormalized columns** — storing `total_volume` on the `workouts` table and updating it on every set change. Fast reads but risk of data inconsistency if update logic has bugs.
- **Event-driven updates** — recalculate and store metrics asynchronously after each set is logged. Adds queue infrastructure complexity not justified for this scale.

## Consequences
**Positive:**
- Metrics are always accurate — computed from the current state of the data, no risk of stale or inconsistent cached values.
- No additional tables or columns to maintain.
- Simpler data model — the schema only stores raw facts (sets, weights, reps).
- Easier to fix calculation bugs — just deploy the fix, historical data recalculates correctly automatically.

**Negative:**
- Analytics queries may be slower for users with very large set histories (10,000+ sets).
- For future scale, materialized views or caching may need to be introduced (see partitioning recommendations in `database-schema.md`).