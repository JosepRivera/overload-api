---
title: Esquema de Base de Datos — Overload
description: "- Tablas"
---

# Esquema de Base de Datos — Overload

## Índice

- [Tablas](#tablas)
  - [Autenticación](#autenticación)
  - [Ejercicios y Rutinas](#ejercicios-y-rutinas)
  - [Workouts](#workouts)
- [Métricas Derivadas](#métricas-derivadas)
- [Índices y Rendimiento](#índices-y-rendimiento)

---

## Tablas

### Autenticación

#### `users`

Almacena la información de autenticación de los usuarios.

| Columna          | Tipo         | Restricciones           | Descripción                |
| ---------------- | ------------ | ------------------------ | ---------------------------- |
| `id`             | UUID         | PRIMARY KEY               | Identificador único del usuario |
| `email`          | VARCHAR(255) | UNIQUE, NOT NULL           | Email del usuario (username)  |
| `password_hash`  | VARCHAR(255) | NOT NULL                   | Hash bcrypt (cost 12)          |
| `name`           | VARCHAR(100) | NOT NULL                   | Nombre visible                 |
| `is_active`      | BOOLEAN      | NOT NULL, DEFAULT TRUE      | Usuario activo / bloqueado      |
| `email_verified` | BOOLEAN      | NOT NULL, DEFAULT FALSE     | Email verificado                |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()     | Fecha de registro                |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()     | Última actualización del perfil  |

**Índices:**
- Índice único parcial sobre `LOWER(email)` para búsquedas case-insensitive
- Índice parcial sobre `is_active` solo para usuarios activos

**Notas:**
- El email se guarda y se consulta en minúsculas
- `is_active = FALSE` permite soft-delete o bloqueo de cuenta
- Los access tokens **no** se almacenan — JWT stateless
- Los refresh tokens **sí** se almacenan (ver tabla siguiente)

---

#### `refresh_tokens`

Gestiona los refresh tokens para la renovación segura de access tokens.

| Columna      | Tipo         | Restricciones                                | Descripción                          |
| ------------ | ------------ | ---------------------------------------------- | --------------------------------------- |
| `id`         | UUID         | PRIMARY KEY                                     | Identificador único del token             |
| `user_id`    | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE      | Dueño del token                            |
| `token_hash` | VARCHAR(255) | UNIQUE, NOT NULL                                 | Hash SHA-256 — nunca texto plano            |
| `expires_at` | TIMESTAMPTZ  | NOT NULL                                         | Fecha de expiración                         |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                          | Fecha de emisión                             |
| `revoked_at` | TIMESTAMPTZ  | NULL                                             | Fecha de revocación (logout / compromiso)     |

**Índices:**
- Índice único sobre `token_hash` para búsquedas rápidas
- Índice compuesto parcial sobre `user_id` donde `revoked_at IS NULL AND expires_at > NOW()`
- Índice sobre `expires_at` para jobs de limpieza

**Políticas de seguridad:**
- TTL: 7 días (configurable vía `JWT_REFRESH_TOKEN_TTL`)
- En logout: `revoked_at = NOW()`
- Máximo 5 tokens activos por usuario — el más antiguo se revoca automáticamente
- Rotación de tokens: el token anterior se revoca en cada refresh

---

### Ejercicios y Rutinas

#### `exercises`

Catálogo personal de ejercicios de cada usuario.

| Columna       | Tipo         | Restricciones                                | Descripción             |
| ------------- | ------------ | ---------------------------------------------- | -------------------------- |
| `id`          | UUID         | PRIMARY KEY                                     | Identificador del ejercicio  |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE      | Dueño del ejercicio           |
| `name`        | VARCHAR(150) | NOT NULL                                         | Nombre del ejercicio            |
| `category`    | VARCHAR(100) | NOT NULL                                         | Grupo muscular                   |
| `type`        | VARCHAR(50)  | NOT NULL                                         | Tipo de movimiento                |
| `notes`       | TEXT         | NULL                                             | Notas de técnica del usuario       |
| `is_archived` | BOOLEAN      | NOT NULL, DEFAULT FALSE                          | Flag de soft delete                 |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                          | Fecha de creación                    |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                          | Última modificación                   |

**Restricciones:**
- `category` → `chest` | `back` | `legs` | `shoulders` | `arms` | `core` | `cardio` | `other`
- `type` → `compound` | `isolation` | `cardio` | `stretching`

**Índices:**
- Índice parcial sobre `user_id` donde `is_archived = FALSE`
- Índice compuesto sobre `(user_id, category)`
- Índice único parcial sobre `(user_id, LOWER(name))` donde `is_archived = FALSE`

**Notas:**
- Nunca se borra en duro si el ejercicio tiene sets asociados
- `is_archived = TRUE` lo oculta del catálogo activo
- Se permiten nombres duplicados si uno está archivado
- El usuario puede restaurar un ejercicio archivado en cualquier momento

---

#### `routines`

Plantillas de entrenamiento creadas por el usuario.

| Columna       | Tipo         | Restricciones                                | Descripción                  |
| ------------- | ------------ | ---------------------------------------------- | -------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                     | Identificador de la rutina           |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE      | Dueño                                 |
| `name`        | VARCHAR(150) | NOT NULL                                         | Nombre de la rutina                    |
| `description` | TEXT         | NULL                                             | Descripción opcional                     |
| `is_active`   | BOOLEAN      | NOT NULL, DEFAULT TRUE                           | Rutina activa / archivada                 |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                          | Fecha de creación                          |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                          | Última modificación                         |

**Índices:**
- Índice parcial sobre `user_id` donde `is_active = TRUE`
- Índice único parcial sobre `(user_id, LOWER(name))` donde `is_active = TRUE`

---

#### `routine_exercises`

Tabla de asociación entre rutinas y ejercicios con la configuración objetivo.

| Columna           | Tipo    | Restricciones                                           | Descripción                             |
| ----------------- | ------- | ---------------------------------------------------------- | ------------------------------------------- |
| `id`              | UUID    | PRIMARY KEY                                                  | Identificador                                  |
| `routine_id`      | UUID    | FK → routines(id), NOT NULL, ON DELETE CASCADE                | Rutina padre                                    |
| `exercise_id`     | UUID    | FK → exercises(id), NOT NULL                                  | Ejercicio asociado                               |
| `target_sets`     | INTEGER | NOT NULL, CHECK (target_sets > 0)                              | Series objetivo                                   |
| `target_reps_min` | INTEGER | NOT NULL, CHECK (target_reps_min > 0)                          | Repeticiones mínimas objetivo                       |
| `target_reps_max` | INTEGER | NOT NULL, CHECK (target_reps_max >= target_reps_min)           | Repeticiones máximas objetivo                       |
| `target_rest_sec` | INTEGER | NOT NULL, CHECK (target_rest_sec >= 0)                         | Descanso en segundos                                 |
| `order_index`     | INTEGER | NOT NULL, CHECK (order_index >= 0)                             | Orden dentro de la rutina (0-indexado)                |
| `notes`           | TEXT    | NULL                                                            | Notas de técnica o carga                              |

**Índices:**
- Índice compuesto sobre `(routine_id, order_index)`
- Índice único sobre `(routine_id, order_index)` para evitar duplicados
- Índice sobre `exercise_id` para búsquedas inversas

---

### Workouts

#### `workouts`

Sesiones de entrenamiento reales realizadas por el usuario.

| Columna       | Tipo        | Restricciones                                | Descripción                          |
| ------------- | ----------- | ---------------------------------------------- | ---------------------------------------- |
| `id`          | UUID        | PRIMARY KEY                                     | Identificador del workout                  |
| `user_id`     | UUID        | FK → users(id), NOT NULL, ON DELETE CASCADE      | Usuario que realizó el workout                |
| `routine_id`  | UUID        | FK → routines(id), NULL, ON DELETE SET NULL      | Rutina usada (opcional)                        |
| `started_at`  | TIMESTAMPTZ | NOT NULL                                         | Inicio del workout                              |
| `finished_at` | TIMESTAMPTZ | NULL                                             | Fin del workout                                  |
| `notes`       | TEXT        | NULL                                             | Notas de la sesión                                |
| `created_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                          | Fecha de registro                                  |

**Restricciones:**
- `finished_at` debe ser `NULL` o `>= started_at`
- Duración máxima del workout: 6 horas
- Solo 1 workout activo por usuario a la vez (impuesto vía índice único parcial)

**Índices:**
- Índice compuesto sobre `(user_id, started_at DESC)` para el timeline
- Índice único parcial sobre `user_id` donde `finished_at IS NULL` — impone 1 workout activo por usuario
- Índice sobre `routine_id`

**Estados del workout:**

| `finished_at` | Estado       |
| ------------- | ------------ |
| `NULL`        | En progreso    |
| No nulo       | Completado      |

**Políticas:**
- Los workouts sin sets pueden borrarse
- Los workouts con sets son inmutables — solo `notes` puede actualizarse

---

#### `sets`

Sets individuales realizados dentro de un workout.

| Columna       | Tipo         | Restricciones                                     | Descripción                              |
| ------------- | ------------ | ---------------------------------------------------- | --------------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                            | Identificador del set                            |
| `workout_id`  | UUID         | FK → workouts(id), NOT NULL, ON DELETE CASCADE          | Workout padre                                     |
| `exercise_id` | UUID         | FK → exercises(id), NOT NULL                            | Ejercicio realizado                                |
| `set_number`  | INTEGER      | NOT NULL, CHECK (set_number > 0)                        | Número de set dentro del ejercicio                  |
| `weight`      | NUMERIC(6,2) | NOT NULL, CHECK (weight >= 0)                           | Peso en kg (máx 9999.99)                             |
| `reps`        | INTEGER      | NOT NULL, CHECK (reps > 0)                              | Repeticiones completadas                              |
| `rpe`         | NUMERIC(3,1) | NULL, CHECK (rpe >= 1 AND rpe <= 10)                    | Rate of Perceived Exertion (opcional)                  |
| `is_warmup`   | BOOLEAN      | NOT NULL, DEFAULT FALSE                                 | Excluido de estadísticas y PRs                          |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                                 | Timestamp de registro                                    |

**Índices:**
- Índice compuesto sobre `(workout_id, exercise_id, set_number)`
- Índice único sobre `(workout_id, exercise_id, set_number)` para evitar duplicados
- Índice sobre `(exercise_id, created_at DESC)` para consultas de historial
- Índice parcial sobre `(exercise_id, weight DESC, reps DESC)` donde `is_warmup = FALSE` para búsquedas de PR

**Notas:**
- `set_number` se reinicia por ejercicio dentro de cada workout
- `weight = 0.00` es válido para ejercicios de peso corporal
- Los sets de calentamiento se almacenan pero se excluyen de todos los cálculos

---

## Métricas Derivadas

Todas las métricas se calculan on-demand — **nunca se persisten en la base de datos**.

| Métrica                       | Fórmula                       | Condición                          |
| ------------------------------ | ------------------------------ | ------------------------------------ |
| Volumen por set                | `weight × reps`                 | `is_warmup = FALSE`                    |
| Volumen total por workout       | `SUM(weight × reps)`            | `is_warmup = FALSE`                    |
| PR de peso                     | `MAX(weight)` por ejercicio       | `is_warmup = FALSE`                    |
| PR de volumen                  | `MAX(weight × reps)` por set       | `is_warmup = FALSE`                    |
| Estimación de 1RM (Epley)      | `weight × (1 + reps / 30.0)`        | `reps <= 10`, `is_warmup = FALSE`        |

### Progresión Histórica
Agregada por fecha de workout (orden cronológico descendente):
- Peso promedio por ejercicio
- Repeticiones promedio por ejercicio
- Volumen total por sesión

---

## Índices y Rendimiento

### Índices SQL personalizados (migración)

Estos índices no pueden expresarse en el schema de Prisma y deben agregarse a mano:

```sql
-- Users: email case-insensitive
CREATE UNIQUE INDEX users_email_lower_unique
ON users (LOWER(email));

-- Exercises: nombre único por usuario (no archivados)
CREATE UNIQUE INDEX exercises_user_name_unique
ON exercises (user_id, LOWER(name))
WHERE is_archived = FALSE;

-- Routines: nombre único por usuario (activas)
CREATE UNIQUE INDEX routines_user_name_unique
ON routines (user_id, LOWER(name))
WHERE is_active = TRUE;

-- Workouts: impone 1 activo por usuario
CREATE UNIQUE INDEX workouts_one_active_per_user
ON workouts (user_id)
WHERE finished_at IS NULL;

-- Sets: búsquedas de PR (solo no-warmup)
CREATE INDEX sets_pr_lookup_idx
ON sets (exercise_id, weight DESC, reps DESC)
WHERE is_warmup = FALSE;
```

### Particionado (a futuro)

Para usuarios con 10.000+ sets, considerar particionar la tabla `sets` por rango de año usando el particionado nativo de PostgreSQL sobre `created_at`.

---

## Orden de creación de tablas

| Orden | Tabla                | Depende de              |
| ----- | -------------------- | -------------------------- |
| 1     | `users`               | —                             |
| 2     | `refresh_tokens`      | users                          |
| 3     | `exercises`           | users                           |
| 4     | `routines`            | users                             |
| 5     | `routine_exercises`   | routines + exercises               |
| 6     | `workouts`            | users + routines                    |
| 7     | `sets`                | workouts + exercises                 |
