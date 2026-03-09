# 0007 — Soft Delete on Exercises

## Status
Accepted

## Date
2026-03-08

## Context
Users can create exercises and log sets against them. If a user later wants to delete an exercise, a hard delete would cascade to all historical sets that reference it — permanently destroying training history. Alternatively, preventing deletion entirely would be frustrating from a UX perspective.

## Decision
Exercises are **never hard-deleted** from the database. Instead, they are marked with `is_archived = TRUE` to hide them from the active catalog while preserving all historical data.

## Alternatives Considered
- **Hard delete with CASCADE** — simple, but destroys all set history linked to that exercise. Unacceptable for a training tracking app where history is the core value.
- **Hard delete with SET NULL on sets** — sets would lose their exercise reference, making historical data meaningless and unqueryable by exercise.
- **Prevent deletion entirely** — poor UX. Users expect to be able to remove exercises they no longer use.
- **Move to a separate archive table** — preserves data but adds complexity with joins across tables.

## Consequences
**Positive:**
- Training history is always intact and queryable, even for archived exercises.
- Duplicate exercise names are allowed if one is archived — the unique constraint only applies to active (`is_archived = FALSE`) exercises.
- Consistent with how professional applications handle data with historical significance.

**Negative:**
- All queries to the exercise catalog must explicitly filter `WHERE is_archived = FALSE` to avoid showing archived exercises to users.
- The exercises table grows over time and is never cleaned. A partial index on `is_archived = FALSE` mitigates query performance impact.
- Application logic must prevent creating new exercises with the same name as an active exercise (enforced via unique partial index).