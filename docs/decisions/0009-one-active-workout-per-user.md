# 0009 — One Active Workout per User at a Time

## Status
Accepted

## Date
2026-03-08

## Context
A workout is considered active when `finished_at IS NULL`. Without a constraint, a user could technically start multiple workout sessions simultaneously — for example, by opening the app on two devices or by a bug that creates a second session before finishing the first.

## Decision
**Only one active workout per user is allowed at any given time.** The application enforces this at the service layer before creating a new workout session.

## Alternatives Considered
- **Allow multiple concurrent active workouts** — unclear UX, makes it ambiguous which session sets belong to, and complicates the "current workout" concept in the frontend.
- **Auto-finish previous workout on new start** — convenience feature but silently mutates data without explicit user action, potentially marking incomplete sessions as finished.
- **Database-level constraint** — a partial unique index on `user_id WHERE finished_at IS NULL` enforces this at the DB level, used as a safety net alongside application-level validation.

## Consequences
**Positive:**
- Clear and unambiguous concept of "current session" — the frontend always knows which workout is active.
- Prevents duplicate or ghost sessions caused by bugs or multi-device usage.
- Simplifies analytics — no need to handle overlapping session time ranges.

**Negative:**
- If a user starts a workout and the app crashes before they can finish it, the session remains open indefinitely until the user manually closes or deletes it.
- Users with multiple devices must finish their active session on one device before starting a new one on another.