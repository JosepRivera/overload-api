# Database Schema - Workout Tracking Application

## Table of Contents

- [Tables](#-tables)
  - [Authentication](#authentication)
  - [Exercises and Routines](#exercises-and-routines)
  - [Workouts](#workouts)
- [Derived Metrics](#-derived-metrics)
- [Indexes and Performance](#️-indexes-and-performance)

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
| `is_active`      | BOOLEAN      | NOT NULL, DEFAULT TRUE  | Active/blocked user    |
| `email_verified` | BOOLEAN      | NOT NULL, DEFAULT FALSE | Email verified         |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | Registration date      |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | Last profile update    |

**Indexes:**
- Unique index on `email` (case-insensitive using LOWER)
- Partial index on `is_active` for active users only

**Important notes:**
- Email is stored in lowercase for case-insensitive lookups
- `is_active` allows soft-delete or account blocking
- **Access tokens are NOT stored** (stateless JWT)
- **Refresh tokens ARE stored** (see next table)

---

#### `refresh_tokens`

Manages refresh tokens for secure access token renewal.

| Column        | Type         | Constraints                                 | Description                         |
| ------------- | ------------ | ------------------------------------------- | ----------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Unique token identifier             |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Token owner                         |
| `token_hash`  | VARCHAR(255) | UNIQUE, NOT NULL                            | SHA-256 hash of the refresh token   |
| `expires_at`  | TIMESTAMPTZ  | NOT NULL                                    | Expiration date                     |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Issue date                          |
| `revoked_at`  | TIMESTAMPTZ  | NULL                                        | Revocation date (logout/compromise) |
| `device_info` | VARCHAR(255) | NULL                                        | Device info (optional)              |
| `ip_address`  | INET         | NULL                                        | Creation IP (audit)                 |

**Indexes:**
- Unique index on `token_hash` for fast lookups
- Composite index on `user_id` for valid tokens only (not revoked and not expired)
- Index on `expires_at` for automatic cleanup of expired tokens

**Security policies:**
- Refresh tokens expire in 30–90 days (configurable)
- On logout, token is revoked (`revoked_at = NOW()`)
- Automatic cleanup of expired tokens (cron job)
- Maximum 5 active tokens per user (device limit)
- Token rotation: on refresh, the previous token is revoked

---

### Exercises and Routines

#### `exercises`

Personal exercise catalog for each user.

| Column        | Type         | Constraints                                 | Description                        |
| ------------- | ------------ | ------------------------------------------- | ---------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Exercise identifier                |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Exercise owner                     |
| `name`        | VARCHAR(150) | NOT NULL                                    | Exercise name                      |
| `category`    | VARCHAR(100) | NOT NULL                                    | Muscle group (chest, back, etc.)   |
| `type`        | VARCHAR(50)  | NOT NULL                                    | Type (compound, isolation, cardio) |
| `notes`       | TEXT         | NULL                                        | User technical notes               |
| `is_archived` | BOOLEAN      | NOT NULL, DEFAULT FALSE                     | Archived exercise (not deleted)    |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Creation date                      |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Last modified                      |

**Indexes:**
- Index on `user_id` for non-archived exercises only
- Composite index on `user_id` and `category` for filtering
- Unique index on `user_id` + `name` combination (case-insensitive) for non-archived only

**Additional constraints:**
- `category` must be one of: 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'other'
- `type` must be one of: 'compound', 'isolation', 'cardio', 'stretching'

**Notes:**
- Exercises are not physically deleted if they have history
- They are marked as `is_archived = TRUE` to hide them
- Duplicate names are allowed if one is archived

---

#### `routines`

Workout templates created by the user.

| Column        | Type         | Constraints                                 | Description             |
| ------------- | ------------ | ------------------------------------------- | ----------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Routine identifier      |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Owner                   |
| `name`        | VARCHAR(150) | NOT NULL                                    | Routine name            |
| `description` | TEXT         | NULL                                        | Optional description    |
| `is_active`   | BOOLEAN      | NOT NULL, DEFAULT TRUE                      | Active/archived routine |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Creation date           |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Last modified           |

**Indexes:**
- Index on `user_id` for active routines only
- Unique index on `user_id` + `name` combination (case-insensitive) for active routines only

---

#### `routine_exercises`

Association table between routines and exercises with target configuration.

| Column            | Type    | Constraints                                          | Description                          |
| ----------------- | ------- | ---------------------------------------------------- | ------------------------------------ |
| `id`              | UUID    | PRIMARY KEY                                          | Identifier                           |
| `routine_id`      | UUID    | FK → routines(id), NOT NULL, ON DELETE CASCADE       | Parent routine                       |
| `exercise_id`     | UUID    | FK → exercises(id), NOT NULL                         | Associated exercise                  |
| `target_sets`     | INTEGER | NOT NULL, CHECK (target_sets > 0)                    | Target sets (3–5)                    |
| `target_reps_min` | INTEGER | NOT NULL, CHECK (target_reps_min > 0)                | Minimum target reps (8)              |
| `target_reps_max` | INTEGER | NOT NULL, CHECK (target_reps_max >= target_reps_min) | Maximum target reps (12)             |
| `target_rest_sec` | INTEGER | NOT NULL, CHECK (target_rest_sec >= 0)               | Rest in seconds (60–180)             |
| `order_index`     | INTEGER | NOT NULL, CHECK (order_index >= 0)                   | Order within the routine (0-indexed) |
| `notes`           | TEXT    | NULL                                                 | Specific notes (technique, load)     |

**Indexes:**
- Composite index on `routine_id` and `order_index` for efficient ordering
- Index on `exercise_id` for reverse lookups
- Unique index on `routine_id` + `order_index` to avoid duplicates

**Notes:**
- Rep range (min–max) allows flexibility in progression
- `order_index` must be consecutive within each routine
- If an exercise is deleted, options are:
  - Option A: Keep the link (soft delete on exercises)
  - Option B: SET NULL + deleted exercise flag

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
| `notes`       | TEXT        | NULL                                        | Workout notes (energy, etc.)   |
| `created_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                     | Record date                    |

**Indexes:**
- Composite index on `user_id` and `started_at` descending for timeline
- Index on `routine_id` for filtering by routine
- Partial index on `user_id` for active workouts only (no `finished_at`)
- Index on `started_at` date (converted to UTC) for daily aggregations

**Constraints:**
- `finished_at` must be NULL or greater than or equal to `started_at`
- Maximum workout duration: 6 hours (difference between `finished_at` and `started_at`)

**Workout states:**
- `finished_at IS NULL` → In progress
- `finished_at IS NOT NULL` → Completed

**Policies:**
- Only 1 active workout per user at a time
- Workouts without sets can be deleted
- Workouts with sets are immutable (only notes can be added)

---

#### `sets`

Individual sets performed within a workout.

| Column        | Type         | Constraints                                    | Description                            |
| ------------- | ------------ | ---------------------------------------------- | -------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                    | Set identifier                         |
| `workout_id`  | UUID         | FK → workouts(id), NOT NULL, ON DELETE CASCADE | Parent workout                         |
| `exercise_id` | UUID         | FK → exercises(id), NOT NULL                   | Exercise performed                     |
| `set_number`  | INTEGER      | NOT NULL, CHECK (set_number > 0)               | Set number (1, 2, 3…)                  |
| `weight`      | NUMERIC(6,2) | NOT NULL, CHECK (weight >= 0)                  | Weight in kg (max 9999.99)             |
| `reps`        | INTEGER      | NOT NULL, CHECK (reps > 0)                     | Completed reps                         |
| `rpe`         | NUMERIC(3,1) | NULL, CHECK (rpe >= 1 AND rpe <= 10)           | Rate of Perceived Exertion (6.5–10)    |
| `is_warmup`   | BOOLEAN      | NOT NULL, DEFAULT FALSE                        | Warm-up set (does not count for stats) |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                        | Record timestamp                       |

**Indexes:**
- Composite index on `workout_id`, `exercise_id`, and `set_number` for ordered queries
- Index on `exercise_id` and `created_at` descending for history
- Specialized index for PR lookups: `exercise_id`, `weight` desc, `reps` desc (non-warmup sets only)

**Additional constraints:**
- Unique composite index on `workout_id` + `exercise_id` + `set_number` to avoid duplicate sets
- Validate that `exercise_id` belongs to the workout's user (implement via trigger or application layer with Prisma)

**Notes:**
- `set_number` resets per exercise within the workout
- Warm-up sets (`is_warmup = TRUE`) do not count for PRs
- RPE is optional but recommended for intensity tracking
- Weight of 0.00 is valid (bodyweight exercises)

---

## Derived Metrics

All these metrics are calculated on-demand — **they are NOT persisted in tables**.

### 1. Volume per Set
Formula: `weight × reps` for each set where `is_warmup = FALSE`

### 2. Total Volume per Workout
Formula: Sum of `(weight × reps)` for all sets in a workout, excluding warm-ups

### 3. Personal Record (PR) per Exercise
- Weight PR: Maximum `weight` achieved for an exercise
- Volume PR: Maximum `(weight × reps)` achieved in a single set

### 4. 1RM Estimate (Epley Formula)
Formula: `weight × (1 + reps / 30.0)`
- Only applicable for sets with ≤ 10 reps
- Exclude warm-ups

### 5. Historical Progression
Aggregate by workout date:
- Average weight per exercise
- Average reps per exercise
- Total volume per session

Order chronologically descending.

---

## Indexes and Performance

### Indexing Strategy

#### Search Indexes
- `users(email)` → Frequent login
- `exercises(user_id, name)` → Exercise search
- `workouts(user_id, started_at)` → Workout timeline

#### Join Indexes
- `sets(workout_id, exercise_id)` → Volume queries
- `routine_exercises(routine_id)` → Routine loading

#### Partial Indexes (Performance)
- **Active workouts**: Index on `user_id` where `finished_at IS NULL` (very frequent queries)
- **Active exercises**: Index on `user_id` where `is_archived = FALSE`
- **Valid refresh tokens**: Index on `user_id` where `revoked_at IS NULL` and `expires_at > NOW()`

### Partitioning Recommendations (Future)

For users with 10,000+ workouts, consider partitioning the `sets` table by year:
- Partition by date range (e.g., sets_2024, sets_2025, etc.)
- Use native PostgreSQL range partitioning on `created_at`

---

## Suggested Migrations

### Table Creation Order

1. `users` (no dependencies)
2. `refresh_tokens` (depends on users)
3. `exercises` (depends on users)
4. `routines` (depends on users)
5. `routine_exercises` (depends on routines + exercises)
6. `workouts` (depends on users + routines)
7. `sets` (depends on workouts + exercises)

### Prisma Migration Guide

**Recommended model order in `schema.prisma`:**

1. `User` (no dependencies)
2. `RefreshToken` (depends on User)
3. `Exercise` (depends on User)
4. `Routine` (depends on User)
5. `RoutineExercise` (depends on Routine + Exercise)
6. `Workout` (depends on User + Routine)
7. `Set` (depends on Workout + Exercise)