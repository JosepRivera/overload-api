# Business Rules — Overload API

## Table of Contents

- [Overview](#overview)
- [User Lifecycle](#user-lifecycle)
- [Authentication Flow](#authentication-flow)
- [Exercises](#exercises)
- [Routines](#routines)
- [Workouts](#workouts)
- [Sets](#sets)
- [Analytics & Metrics](#analytics--metrics)
- [Cross-cutting Rules](#cross-cutting-rules)

---

## Overview

Overload API is a strength training tracker built around **progressive overload**: the practice of gradually increasing training stimulus (weight, reps, volume) to drive measurable muscular adaptation over time.

The core loop is:

```
User creates exercises
       ↓
User builds routines (optional — workouts can be free)
       ↓
User starts a workout session (optionally linked to a routine)
       ↓
User logs sets (exercise + weight + reps) during the session
       ↓
User finishes the workout
       ↓
System calculates volume, PRs and 1RM on demand from logged sets
```

---

## User Lifecycle

### Registration
- A user registers with **email + name + password**.
- Email is stored and treated as **case-insensitive** (lowercased internally).
- Passwords are hashed with **bcrypt** before storage — never stored in plain text.
- On successful registration, the API immediately returns an access token + refresh token so the user is logged in straight away.

### Login
- User authenticates with email + password.
- On success, receives an **access token** (15 min TTL) and a **refresh token** (7 day TTL).

### Session Management
- The access token is **stateless** — never stored in the database. Validated cryptographically on every request.
- The refresh token **is** stored as a SHA-256 hash — never as plain text.
- A user can have **at most 5 active refresh tokens** simultaneously (i.e. 5 logged-in devices/sessions). When the limit is reached, the **oldest active token is automatically revoked**.
- On every token refresh, the old refresh token is revoked and a new one is issued (token rotation).
- On logout, the refresh token is immediately revoked (`revoked_at = NOW()`).

### Account States
| State               | Behavior                                             |
| ------------------- | ---------------------------------------------------- |
| `is_active = TRUE`  | Normal — can authenticate and use the API            |
| `is_active = FALSE` | Blocked — cannot log in (soft block, data preserved) |

---

## Authentication Flow

```
POST /auth/register   → creates user + issues access + refresh token
POST /auth/login      → verifies credentials + issues access + refresh token
POST /auth/refresh    → validates refresh token → rotates tokens (old revoked, new issued)
POST /auth/logout     → revokes the provided refresh token
```

**Rules:**
- `password_hash` is **never** returned in any response.
- If a refresh token is expired, revoked, or not found — the request is rejected with 401.
- If a user has 5 active tokens and logs in again, the oldest is silently revoked.

---

## Exercises

Exercises are the **personal catalog** of movements a user can log sets against. Each user manages their own catalog independently.

### Creating Exercises
- Each exercise has a `name`, `category` (e.g. chest, back, legs) and `type` (compound, isolation, cardio, stretching).
- Exercise names are **unique per user, case-insensitive**, among non-archived exercises.
  - A user cannot have two active exercises named "Bench Press" and "bench press".
  - A user *can* have an archived "Bench Press" and a new active "Bench Press" (the unique constraint only applies to active ones).

### Archiving (Soft Delete)
- Exercises are **never hard-deleted** if they have associated sets in the history.
- Instead, they are marked `is_archived = TRUE` — hidden from the active catalog but preserved.
- The user can **restore** an archived exercise at any time.
- When listing exercises, archived ones are excluded by default. The client can opt in to include them.

**Why:** Training history is the core value of the app. Deleting an exercise would destroy all historical set data linked to it.

### Exercise States
| State                 | Visible in catalog | Can log sets against it | Can be restored |
| --------------------- | ------------------ | ----------------------- | --------------- |
| `is_archived = FALSE` | ✅ Yes              | ✅ Yes                   | —               |
| `is_archived = TRUE`  | ❌ No (default)     | ❌ No                    | ✅ Yes           |

---

## Routines

Routines are **workout templates** — a predefined list of exercises with target sets, rep ranges and rest times. They are optional; a user can start a workout without one.

### Creating Routines
- Routine names are **unique per user, case-insensitive**, among active routines.
- A routine can have a `description` (optional).

### Adding Exercises to a Routine
- Only **active (non-archived) exercises** belonging to the same user can be added.
- An exercise can only appear **once** in a given routine.
- Each exercise entry stores: `target_sets`, `target_reps_min`, `target_reps_max`, `target_rest_sec`, `order_index`, and optional `notes`.
- `target_reps_max` must be **≥ target_reps_min**.
- The `order_index` determines the display order (0-indexed). It can be reordered.

### Reordering
- The client sends the full desired order as an array of `{ id, order_index }`.
- All IDs must belong to the routine. Partial reorders are not allowed.
- `order_index` values must be unique within the routine.

### Deactivating (Soft Delete)
- Routines are **never hard-deleted**. They are marked `is_active = FALSE`.
- Workouts that were linked to a deactivated routine keep their `routine_id` reference (historical record).
- A deactivated routine cannot be updated or have exercises added to it.

### Routine States
| State               | Visible | Can be used to start workout | Can be edited |
| ------------------- | ------- | ---------------------------- | ------------- |
| `is_active = TRUE`  | ✅ Yes   | ✅ Yes                        | ✅ Yes         |
| `is_active = FALSE` | ❌ No    | ❌ No                         | ❌ No          |

---

## Workouts

A workout represents a **real training session** performed by the user.

### Starting a Workout
- A user can have **at most 1 active workout** at a time (enforced at both service and database level via a unique partial index on `user_id WHERE finished_at IS NULL`).
- Starting a new workout while one is already active returns a conflict error — the user must finish or delete the current one first.
- `routine_id` is optional — the user can start a "free workout" with no template.
- `started_at` is required (client-provided timestamp, e.g. when the user tapped "Start").

### Finishing a Workout
- `POST /workouts/:id/finish` — the server sets `finished_at = NOW()`.
- A workout is **immutable once it has sets** — only `notes` can be updated after sets have been logged.
- A workout without sets can be deleted.

### Workout States
| `finished_at` | State                  | Can add sets | Can delete     | Can update   |
| ------------- | ---------------------- | ------------ | -------------- | ------------ |
| `NULL`        | 🟡 Active / In progress | ✅ Yes        | ✅ (if no sets) | ✅ notes only |
| Not null      | ✅ Completed            | ❌ No         | ❌ No           | ✅ notes only |

### Constraints
- `finished_at` must be `>= started_at` if provided.
- Maximum workout duration: **6 hours**.
- If a session is abandoned (app crash, etc.), it remains open indefinitely until the user manually closes or deletes it.

---

## Sets

Sets are the **atomic unit of training data** — a single exercise performed for a given weight and reps within a workout.

### Logging a Set
- A set belongs to a workout and references an exercise.
- Required fields: `exercise_id`, `set_number`, `weight`, `reps`.
- Optional: `rpe` (Rate of Perceived Exertion, 1.0–10.0 in 0.5 steps), `is_warmup`.
- `weight = 0.00` is valid for bodyweight exercises.
- `set_number` is unique per `(workout_id, exercise_id)` — no two sets can share the same number for the same exercise in the same workout.

### Warmup Sets
- A set marked `is_warmup = TRUE` is **recorded but excluded** from all statistical calculations: volume, PRs and 1RM.
- This reflects real training practice: warmup sets use lighter weights and are not representative of actual performance.
- The user must correctly mark warmup sets — data quality depends on user discipline.

### Set Immutability
- Sets can only be added to **active (in-progress) workouts**.
- Once a workout is finished, its sets cannot be modified.

---

## Analytics & Metrics

All metrics are **calculated on-demand** at query time. Nothing is pre-computed or stored in the database — calculations always reflect the current state of the data.

### Volume
- **Per set:** `weight × reps`
- **Per workout:** `SUM(weight × reps)` across all non-warmup sets

### Personal Records (PRs)
Two types of PRs are tracked per exercise:
- **Weight PR:** `MAX(weight)` across all non-warmup sets for that exercise
- **Volume PR:** `MAX(weight × reps)` across all non-warmup sets for that exercise

PRs are user-scoped — each user has their own records.

### 1RM Estimation (Epley Formula)
```
1RM = weight × (1 + reps / 30.0)
```
- Only applies to sets where `reps <= 10`. Higher rep sets produce unreliable 1RM estimates with this formula.
- Only applies to non-warmup sets.
- This is an **estimate**, not a tested max.

### Historical Progression
Aggregated per exercise over time (chronologically):
- Average weight per session
- Average reps per session
- Total volume per session

### Summary of Metric Conditions
| Metric         | Formula                      | Condition                         |
| -------------- | ---------------------------- | --------------------------------- |
| Set volume     | `weight × reps`              | `is_warmup = FALSE`               |
| Workout volume | `SUM(weight × reps)`         | `is_warmup = FALSE`               |
| Weight PR      | `MAX(weight)`                | `is_warmup = FALSE`               |
| Volume PR      | `MAX(weight × reps)`         | `is_warmup = FALSE`               |
| 1RM estimate   | `weight × (1 + reps / 30.0)` | `reps <= 10`, `is_warmup = FALSE` |

---

## Cross-cutting Rules

### Data Ownership
- All resources (exercises, routines, workouts, sets) are **user-scoped**.
- A user can only read, create, or modify their own data.
- Accessing another user's resources returns 403 Forbidden.

### Soft Deletes vs Hard Deletes
| Resource      | Delete Strategy                   | Reason                                         |
| ------------- | --------------------------------- | ---------------------------------------------- |
| User          | Soft (`is_active = FALSE`)        | Preserves all training history                 |
| Exercise      | Soft (`is_archived = TRUE`)       | Preserves set history linked to it             |
| Routine       | Soft (`is_active = FALSE`)        | Preserves workout history linked to it         |
| Workout       | Hard (only if no sets)            | No history to preserve                         |
| Set           | Hard                              | Sets are the raw data; deletion is intentional |
| Refresh token | Logical revocation (`revoked_at`) | Audit trail for security                       |

### Naming Uniqueness
| Resource      | Scope    | Case sensitive     | Among                               |
| ------------- | -------- | ------------------ | ----------------------------------- |
| Exercise name | Per user | ❌ No (LOWER index) | Active only (`is_archived = FALSE`) |
| Routine name  | Per user | ❌ No (LOWER index) | Active only (`is_active = TRUE`)    |
| User email    | Global   | ❌ No (LOWER index) | All users                           |

### Response Shape
- All successful responses: `{ data: ... }`
- DELETE operations: `204 No Content` — no body
- Errors: `{ statusCode, error, message }`
- `password_hash` is **never** included in any response