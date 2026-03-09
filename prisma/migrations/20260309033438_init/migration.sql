-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_exercises" (
    "id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "target_sets" INTEGER NOT NULL,
    "target_reps_min" INTEGER NOT NULL,
    "target_reps_max" INTEGER NOT NULL,
    "target_rest_sec" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "routine_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "routine_id" UUID,
    "started_at" TIMESTAMPTZ NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sets" (
    "id" UUID NOT NULL,
    "workout_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "weight" DECIMAL(6,2) NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" DECIMAL(3,1),
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "exercises_user_id_idx" ON "exercises"("user_id");

-- CreateIndex
CREATE INDEX "exercises_user_id_category_idx" ON "exercises"("user_id", "category");

-- CreateIndex
CREATE INDEX "routines_user_id_idx" ON "routines"("user_id");

-- CreateIndex
CREATE INDEX "routine_exercises_routine_id_order_index_idx" ON "routine_exercises"("routine_id", "order_index");

-- CreateIndex
CREATE INDEX "routine_exercises_exercise_id_idx" ON "routine_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "routine_exercises_routine_id_order_index_key" ON "routine_exercises"("routine_id", "order_index");

-- CreateIndex
CREATE INDEX "workouts_user_id_started_at_idx" ON "workouts"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "workouts_routine_id_idx" ON "workouts"("routine_id");

-- CreateIndex
CREATE INDEX "sets_workout_id_exercise_id_set_number_idx" ON "sets"("workout_id", "exercise_id", "set_number");

-- CreateIndex
CREATE INDEX "sets_exercise_id_created_at_idx" ON "sets"("exercise_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sets_workout_id_exercise_id_set_number_key" ON "sets"("workout_id", "exercise_id", "set_number");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- CUSTOM INDEXES
-- ─────────────────────────────────────────────

-- Users: email único case-insensitive
CREATE UNIQUE INDEX users_email_lower_unique
ON users (LOWER(email));

-- Exercises: nombre único por usuario (no archivados)
CREATE UNIQUE INDEX exercises_user_name_unique
ON exercises (user_id, LOWER(name))
WHERE is_archived = false;

-- Routines: nombre único por usuario (activas)
CREATE UNIQUE INDEX routines_user_name_unique
ON routines (user_id, LOWER(name))
WHERE is_active = true;

-- Workouts: máximo 1 activo por usuario
CREATE UNIQUE INDEX workouts_one_active_per_user
ON workouts (user_id)
WHERE finished_at IS NULL;

-- Sets: PR lookups (non-warmup only)
CREATE INDEX sets_pr_lookup_idx
ON sets (exercise_id, weight DESC, reps DESC)
WHERE is_warmup = false;