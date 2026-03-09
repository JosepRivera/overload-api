# Database Schema — Overload API

## Table of Contents

- [Tables](#tables)
  - [Authentication](#authentication)
  - [Exercises and Routines](#exercises-and-routines)
  - [Workouts](#workouts)
- [Derived Metrics](#derived-metrics)
- [Indexes and Performance](#indexes-and-performance)

---

## Tables

### Authentication

#### `users`

Stores user authentication information.

| Column           | Type         | Constraints             | Description            |
| ---------------- | ------------ | ----------------------- | ---------------------- |
| `id`             | UUID         | PRIMARY KEY             | Unique user identifier |
| `email`          | VARCHAR(255) | UNIQUE, NOT NULL        | User email (username)  |
| `password_hash`  | VARCHAR(255) | NOT NULL                | bcrypt hash (cost 12)  |
| `name`           | VARCHAR(100) | NOT NULL                | Display name           |
| `is_active`      | BOOLEAN      | NOT NULL, DEFAULT TRUE  | Active / blocked user  |
| `email_verified` | BOOLEAN      | NOT NULL, DEFAULT FALSE | Email verified         |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | Registration date      |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | Last profile update    |

**Indexes:**
- Unique partial index on `LOWER(email)` for case-insensitive lookups
- Partial index on `is_active` for active users only

**Notes:**
- Email is stored and queried in lowercase
- `is_active = FALSE` allows soft-delete or account blocking
- Access tokens are **not** stored — stateless JWT
- Refresh tokens **are** stored (see next table)

---

#### `refresh_tokens`

Manages refresh tokens for secure access token renewal.

| Column       | Type         | Constraints                                 | Description                           |
| ------------ | ------------ | ------------------------------------------- | ------------------------------------- |
| `id`         | UUID         | PRIMARY KEY                                 | Unique token identifier               |
| `user_id`    | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Token owner                           |
| `token_hash` | VARCHAR(255) | UNIQUE, NOT NULL                            | SHA-256 hash — never plain text       |
| `expires_at` | TIMESTAMPTZ  | NOT NULL                                    | Expiration date                       |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Issue date                            |
| `revoked_at` | TIMESTAMPTZ  | NULL                                        | Revocation date (logout / compromise) |

**Indexes:**
- Unique index on `token_hash` for fast lookups
- Composite partial index on `user_id` where `revoked_at IS NULL AND expires_at > NOW()`
- Index on `expires_at` for cleanup jobs

**Security policies:**
- TTL: 7 days (configurable via `JWT_REFRESH_TOKEN_TTL`)
- On logout: `revoked_at = NOW()`
- Maximum 5 active tokens per user — oldest revoked automatically
- Token rotation: previous token is revoked on each refresh

---

### Exercises and Routines

#### `exercises`

Personal exercise catalog for each user.

| Column        | Type         | Constraints                                 | Description          |
| ------------- | ------------ | ------------------------------------------- | -------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Exercise identifier  |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Exercise owner       |
| `name`        | VARCHAR(150) | NOT NULL                                    | Exercise name        |
| `category`    | VARCHAR(100) | NOT NULL                                    | Muscle group         |
| `type`        | VARCHAR(50)  | NOT NULL                                    | Movement type        |
| `notes`       | TEXT         | NULL                                        | User technique notes |
| `is_archived` | BOOLEAN      | NOT NULL, DEFAULT FALSE                     | Soft delete flag     |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Creation date        |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Last modified        |

**Constraints:**
- `category` → `chest` | `back` | `legs` | `shoulders` | `arms` | `core` | `cardio` | `other`
- `type` → `compound` | `isolation` | `cardio` | `stretching`

**Indexes:**
- Partial index on `user_id` where `is_archived = FALSE`
- Composite index on `(user_id, category)`
- Unique partial index on `(user_id, LOWER(name))` where `is_archived = FALSE`

**Notes:**
- Never hard-deleted if the exercise has associated sets
- `is_archived = TRUE` hides it from the active catalog
- Duplicate names allowed if one is archived
- User can restore an archived exercise at any time

---

#### `routines`

Workout templates created by the user.

| Column        | Type         | Constraints                                 | Description               |
| ------------- | ------------ | ------------------------------------------- | ------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Routine identifier        |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Owner                     |
| `name`        | VARCHAR(150) | NOT NULL                                    | Routine name              |
| `description` | TEXT         | NULL                                        | Optional description      |
| `is_active`   | BOOLEAN      | NOT NULL, DEFAULT TRUE                      | Active / archived routine |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Creation date             |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Last modified             |

**Indexes:**
- Partial index on `user_id` where `is_active = TRUE`
- Unique partial index on `(user_id, LOWER(name))` where `is_active = TRUE`

---

#### `routine_exercises`

Association table between routines and exercises with target configuration.

| Column            | Type    | Constraints                                          | Description                          |
| ----------------- | ------- | ---------------------------------------------------- | ------------------------------------ |
| `id`              | UUID    | PRIMARY KEY                                          | Identifier                           |
| `routine_id`      | UUID    | FK → routines(id), NOT NULL, ON DELETE CASCADE       | Parent routine                       |
| `exercise_id`     | UUID    | FK → exercises(id), NOT NULL                         | Associated exercise                  |
| `target_sets`     | INTEGER | NOT NULL, CHECK (target_sets > 0)                    | Target sets                          |
| `target_reps_min` | INTEGER | NOT NULL, CHECK (target_reps_min > 0)                | Minimum target reps                  |
| `target_reps_max` | INTEGER | NOT NULL, CHECK (target_reps_max >= target_reps_min) | Maximum target reps                  |
| `target_rest_sec` | INTEGER | NOT NULL, CHECK (target_rest_sec >= 0)               | Rest in seconds                      |
| `order_index`     | INTEGER | NOT NULL, CHECK (order_index >= 0)                   | Order within the routine (0-indexed) |
| `notes`           | TEXT    | NULL                                                 | Technique or load notes              |

**Indexes:**
- Composite index on `(routine_id, order_index)`
- Unique index on `(routine_id, order_index)` to prevent duplicates
- Index on `exercise_id` for reverse lookups

---

### Workouts

#### `workouts`

Actual training sessions performed by the user.

| Column        | Type        | Constraints                                 | Description                    |
| ------------- | ----------- | ------------------------------------------- | ------------------------------ |
| `id`          | UUID        | PRIMARY KEY                                 | Workout identifier             |
| `user_id`     | UUID        | FK → users(id), NOT NULL, ON DELETE CASCADE | User who performed the workout |
| `routine_id`  | UUID        | FK → routines(id), NULL, ON DELETE SET NULL | Routine used (optional)        |
| `started_at`  | TIMESTAMPTZ | NOT NULL                                    | Workout start                  |
| `finished_at` | TIMESTAMPTZ | NULL                                        | Workout end                    |
| `notes`       | TEXT        | NULL                                        | Session notes                  |
| `created_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                     | Record date                    |

**Constraints:**
- `finished_at` must be `NULL` or `>= started_at`
- Maximum workout duration: 6 hours
- Only 1 active workout per user at a time (enforced via unique partial index)

**Indexes:**
- Composite index on `(user_id, started_at DESC)` for timeline
- Unique partial index on `user_id` where `finished_at IS NULL` — enforces 1 active workout per user
- Index on `routine_id`

**Workout states:**

| `finished_at` | State       |
| ------------- | ----------- |
| `NULL`        | In progress |
| Not null      | Completed   |

**Policies:**
- Workouts without sets can be deleted
- Workouts with sets are immutable — only `notes` can be updated

---

#### `sets`

Individual sets performed within a workout.

| Column        | Type         | Constraints                                    | Description                           |
| ------------- | ------------ | ---------------------------------------------- | ------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                    | Set identifier                        |
| `workout_id`  | UUID         | FK → workouts(id), NOT NULL, ON DELETE CASCADE | Parent workout                        |
| `exercise_id` | UUID         | FK → exercises(id), NOT NULL                   | Exercise performed                    |
| `set_number`  | INTEGER      | NOT NULL, CHECK (set_number > 0)               | Set number within the exercise        |
| `weight`      | NUMERIC(6,2) | NOT NULL, CHECK (weight >= 0)                  | Weight in kg (max 9999.99)            |
| `reps`        | INTEGER      | NOT NULL, CHECK (reps > 0)                     | Completed reps                        |
| `rpe`         | NUMERIC(3,1) | NULL, CHECK (rpe >= 1 AND rpe <= 10)           | Rate of Perceived Exertion (optional) |
| `is_warmup`   | BOOLEAN      | NOT NULL, DEFAULT FALSE                        | Excluded from stats and PRs           |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                        | Record timestamp                      |

**Indexes:**
- Composite index on `(workout_id, exercise_id, set_number)`
- Unique index on `(workout_id, exercise_id, set_number)` to prevent duplicates
- Index on `(exercise_id, created_at DESC)` for history queries
- Partial index on `(exercise_id, weight DESC, reps DESC)` where `is_warmup = FALSE` for PR lookups

**Notes:**
- `set_number` resets per exercise within each workout
- `weight = 0.00` is valid for bodyweight exercises
- Warmup sets are stored but excluded from all calculations

---

## Derived Metrics

All metrics are calculated on-demand — **never persisted in the database**.

| Metric                   | Formula                      | Condition                         |
| ------------------------ | ---------------------------- | --------------------------------- |
| Volume per set           | `weight × reps`              | `is_warmup = FALSE`               |
| Total volume per workout | `SUM(weight × reps)`         | `is_warmup = FALSE`               |
| Weight PR                | `MAX(weight)` per exercise   | `is_warmup = FALSE`               |
| Volume PR                | `MAX(weight × reps)` per set | `is_warmup = FALSE`               |
| 1RM estimate (Epley)     | `weight × (1 + reps / 30.0)` | `reps <= 10`, `is_warmup = FALSE` |

### Historical Progression
Aggregated by workout date (chronologically descending):
- Average weight per exercise
- Average reps per exercise
- Total volume per session

---

## Indexes and Performance

### Custom SQL Indexes (migration)

These indexes cannot be expressed in Prisma schema and must be added manually:

```sql
-- Users: case-insensitive email
CREATE UNIQUE INDEX users_email_lower_unique
ON users (LOWER(email));

-- Exercises: unique name per user (non-archived)
CREATE UNIQUE INDEX exercises_user_name_unique
ON exercises (user_id, LOWER(name))
WHERE is_archived = FALSE;

-- Routines: unique name per user (active)
CREATE UNIQUE INDEX routines_user_name_unique
ON routines (user_id, LOWER(name))
WHERE is_active = TRUE;

-- Workouts: enforce 1 active per user
CREATE UNIQUE INDEX workouts_one_active_per_user
ON workouts (user_id)
WHERE finished_at IS NULL;

-- Sets: PR lookups (non-warmup only)
CREATE INDEX sets_pr_lookup_idx
ON sets (exercise_id, weight DESC, reps DESC)
WHERE is_warmup = FALSE;
```

### Partitioning (Future)

For users with 10,000+ sets, consider range partitioning the `sets` table by year using native PostgreSQL partitioning on `created_at`.

---

## Table Creation Order

| Order | Table               | Depends on           |
| ----- | ------------------- | -------------------- |
| 1     | `users`             | —                    |
| 2     | `refresh_tokens`    | users                |
| 3     | `exercises`         | users                |
| 4     | `routines`          | users                |
| 5     | `routine_exercises` | routines + exercises |
| 6     | `workouts`          | users + routines     |
| 7     | `sets`              | workouts + exercises |