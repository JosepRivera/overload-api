# 🗄️ Database Schema - Workout Tracking Application

> **Versión**: 1.0  
> **Fecha**: Febrero 2026  
> **Mantenedor**: Josep Rivera

---

## 📋 Tabla de Contenidos

- [Tablas](#-tablas)
  - [Autenticación](#autenticación)
  - [Ejercicios y Rutinas](#ejercicios-y-rutinas)
  - [Entrenamientos](#entrenamientos)
- [Métricas Derivadas](#-métricas-derivadas)
- [Índices y Performance](#️-índices-y-performance)

---

## 📊 Tablas

### Autenticación

#### `users`

Almacena la información de autenticación de los usuarios.

| Columna          | Tipo         | Restricciones           | Descripción                     |
| ---------------- | ------------ | ----------------------- | ------------------------------- |
| `id`             | UUID         | PRIMARY KEY             | Identificador único del usuario |
| `email`          | VARCHAR(255) | UNIQUE, NOT NULL        | Email del usuario (username)    |
| `password_hash`  | VARCHAR(255) | NOT NULL                | Hash bcrypt (costo 12)          |
| `is_active`      | BOOLEAN      | NOT NULL, DEFAULT TRUE  | Usuario activo/bloqueado        |
| `email_verified` | BOOLEAN      | NOT NULL, DEFAULT FALSE | Email verificado                |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | Fecha de registro               |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | Última actualización del perfil |

**Índices:**
- Índice único en `email` (case-insensitive usando LOWER)
- Índice parcial en `is_active` solo para usuarios activos

**Notas importantes:**
- El email se almacena en minúsculas para búsquedas case-insensitive
- `is_active` permite soft-delete o bloqueo de cuentas
- **Access tokens NO se almacenan** (son stateless JWT)
- **Refresh tokens SÍ se almacenan** (ver tabla siguiente)

---

#### `refresh_tokens`

Gestiona los refresh tokens para renovación segura de access tokens.

| Columna       | Tipo         | Restricciones                               | Descripción                             |
| ------------- | ------------ | ------------------------------------------- | --------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Identificador único del token           |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Usuario propietario                     |
| `token_hash`  | VARCHAR(255) | UNIQUE, NOT NULL                            | Hash SHA-256 del refresh token          |
| `expires_at`  | TIMESTAMPTZ  | NOT NULL                                    | Fecha de expiración                     |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Fecha de emisión                        |
| `revoked_at`  | TIMESTAMPTZ  | NULL                                        | Fecha de revocación (logout/compromiso) |
| `device_info` | VARCHAR(255) | NULL                                        | Info del dispositivo (opcional)         |
| `ip_address`  | INET         | NULL                                        | IP de creación (auditoría)              |

**Índices:**
- Índice único en `token_hash` para búsquedas rápidas
- Índice compuesto en `user_id` solo para tokens válidos (no revocados y no expirados)
- Índice en `expires_at` para limpieza automática de tokens vencidos

**Políticas de seguridad:**
- Refresh tokens expiran en 30-90 días (configurable)
- Al hacer logout, se revoca el token (`revoked_at = NOW()`)
- Limpieza automática de tokens expirados (cron job)
- Máximo 5 tokens activos por usuario (límite de dispositivos)
- Rotación de tokens: al refrescar, se revoca el anterior

---

### Ejercicios y Rutinas

#### `exercises`

Catálogo personal de ejercicios de cada usuario.

| Columna       | Tipo         | Restricciones                               | Descripción                           |
| ------------- | ------------ | ------------------------------------------- | ------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Identificador del ejercicio           |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Propietario del ejercicio             |
| `name`        | VARCHAR(150) | NOT NULL                                    | Nombre del ejercicio                  |
| `category`    | VARCHAR(100) | NOT NULL                                    | Grupo muscular (pecho, espalda, etc.) |
| `type`        | VARCHAR(50)  | NOT NULL                                    | Tipo (compound, isolation, cardio)    |
| `notes`       | TEXT         | NULL                                        | Notas técnicas del usuario            |
| `is_archived` | BOOLEAN      | NOT NULL, DEFAULT FALSE                     | Ejercicio archivado (no eliminado)    |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Fecha de creación                     |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Última modificación                   |

**Índices:**
- Índice en `user_id` solo para ejercicios no archivados
- Índice compuesto en `user_id` y `category` para filtrado
- Índice único en combinación `user_id` + `name` (case-insensitive) solo si no está archivado

**Restricciones adicionales:**
- `category` debe ser uno de: 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'other'
- `type` debe ser uno de: 'compound', 'isolation', 'cardio', 'stretching'

**Notas:**
- No se eliminan ejercicios físicamente si tienen historial
- Se marcan como `is_archived = TRUE` para ocultar
- Permite duplicados de nombre si uno está archivado

---

#### `routines`

Plantillas de entrenamiento creadas por el usuario.

| Columna       | Tipo         | Restricciones                               | Descripción                |
| ------------- | ------------ | ------------------------------------------- | -------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Identificador de la rutina |
| `user_id`     | UUID         | FK → users(id), NOT NULL, ON DELETE CASCADE | Propietario                |
| `name`        | VARCHAR(150) | NOT NULL                                    | Nombre de la rutina        |
| `description` | TEXT         | NULL                                        | Descripción opcional       |
| `is_active`   | BOOLEAN      | NOT NULL, DEFAULT TRUE                      | Rutina activa/archivada    |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Fecha de creación          |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                     | Última modificación        |

**Índices:**
- Índice en `user_id` solo para rutinas activas
- Índice único en combinación `user_id` + `name` (case-insensitive) solo si está activa

---

#### `routine_exercises`

Tabla de asociación entre rutinas y ejercicios con configuración objetivo.

| Columna           | Tipo    | Restricciones                                        | Descripción                        |
| ----------------- | ------- | ---------------------------------------------------- | ---------------------------------- |
| `id`              | UUID    | PRIMARY KEY                                          | Identificador                      |
| `routine_id`      | UUID    | FK → routines(id), NOT NULL, ON DELETE CASCADE       | Rutina padre                       |
| `exercise_id`     | UUID    | FK → exercises(id), NOT NULL                         | Ejercicio asociado                 |
| `target_sets`     | INTEGER | NOT NULL, CHECK (target_sets > 0)                    | Series objetivo (3-5)              |
| `target_reps_min` | INTEGER | NOT NULL, CHECK (target_reps_min > 0)                | Reps mínimas objetivo (8)          |
| `target_reps_max` | INTEGER | NOT NULL, CHECK (target_reps_max >= target_reps_min) | Reps máximas objetivo (12)         |
| `target_rest_sec` | INTEGER | NOT NULL, CHECK (target_rest_sec >= 0)               | Descanso en segundos (60-180)      |
| `order_index`     | INTEGER | NOT NULL, CHECK (order_index >= 0)                   | Orden en la rutina (0-indexed)     |
| `notes`           | TEXT    | NULL                                                 | Notas específicas (técnica, carga) |

**Índices:**
- Índice compuesto en `routine_id` y `order_index` para ordenamiento eficiente
- Índice en `exercise_id` para búsquedas inversas
- Índice único en combinación `routine_id` + `order_index` para evitar duplicados

**Notas:**
- Rango de reps (min-max) permite flexibilidad en progresión
- `order_index` debe ser consecutivo dentro de cada rutina
- Si se elimina un ejercicio, se puede decidir:
  - Opción A: Mantener el link (soft delete en exercises)
  - Opción B: SET NULL + flag de ejercicio eliminado

---

### Entrenamientos

#### `workouts`

Sesiones reales de entrenamiento realizadas por el usuario.

| Columna       | Tipo        | Restricciones                               | Descripción                       |
| ------------- | ----------- | ------------------------------------------- | --------------------------------- |
| `id`          | UUID        | PRIMARY KEY                                 | Identificador del workout         |
| `user_id`     | UUID        | FK → users(id), NOT NULL, ON DELETE CASCADE | Usuario que realizó el workout    |
| `routine_id`  | UUID        | FK → routines(id), NULL, ON DELETE SET NULL | Rutina usada (opcional)           |
| `started_at`  | TIMESTAMPTZ | NOT NULL                                    | Inicio del entrenamiento          |
| `finished_at` | TIMESTAMPTZ | NULL                                        | Fin del entrenamiento             |
| `notes`       | TEXT        | NULL                                        | Notas del workout (energía, etc.) |
| `created_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                     | Fecha de registro                 |

**Índices:**
- Índice compuesto en `user_id` y `started_at` descendente para timeline
- Índice en `routine_id` para filtrado por rutina
- Índice parcial en `user_id` solo para workouts activos (sin `finished_at`)
- Índice en fecha del `started_at` (convertido a UTC) para agregaciones diarias

**Restricciones:**
- `finished_at` debe ser NULL o mayor/igual que `started_at`
- Duración máxima de workout: 6 horas (diferencia entre `finished_at` y `started_at`)

**Estados del workout:**
- `finished_at IS NULL` → En progreso
- `finished_at IS NOT NULL` → Completado

**Políticas:**
- Solo 1 workout activo por usuario simultáneamente
- Workouts sin sets pueden eliminarse
- Workouts con sets son inmutables (solo se puede agregar notes)

---

#### `sets`

Series individuales realizadas dentro de un workout.

| Columna       | Tipo         | Restricciones                                  | Descripción                            |
| ------------- | ------------ | ---------------------------------------------- | -------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                    | Identificador del set                  |
| `workout_id`  | UUID         | FK → workouts(id), NOT NULL, ON DELETE CASCADE | Workout padre                          |
| `exercise_id` | UUID         | FK → exercises(id), NOT NULL                   | Ejercicio realizado                    |
| `set_number`  | INTEGER      | NOT NULL, CHECK (set_number > 0)               | Número de serie (1, 2, 3...)           |
| `weight`      | NUMERIC(6,2) | NOT NULL, CHECK (weight >= 0)                  | Peso en kg (max 9999.99)               |
| `reps`        | INTEGER      | NOT NULL, CHECK (reps > 0)                     | Repeticiones completadas               |
| `rpe`         | NUMERIC(3,1) | NULL, CHECK (rpe >= 1 AND rpe <= 10)           | Rate of Perceived Exertion (6.5-10)    |
| `is_warmup`   | BOOLEAN      | NOT NULL, DEFAULT FALSE                        | Set de calentamiento (no cuenta stats) |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                        | Timestamp del registro                 |

**Índices:**
- Índice compuesto en `workout_id`, `exercise_id` y `set_number` para queries ordenadas
- Índice en `exercise_id` y `created_at` descendente para historial
- Índice especializado para búsqueda de PRs: `exercise_id`, `weight` desc, `reps` desc (solo sets que no son warmup)

**Restricciones adicionales:**
- Índice único compuesto en `workout_id` + `exercise_id` + `set_number` para evitar sets duplicados
- Validar que `exercise_id` pertenece al usuario del workout (implementar via trigger o en application layer con Prisma)

**Notas:**
- `set_number` resetea por ejercicio dentro del workout
- Sets de calentamiento (`is_warmup = TRUE`) no cuentan para PRs
- RPE es opcional pero recomendado para tracking de intensidad
- Peso de 0.00 es válido (ejercicios de peso corporal)

---

## 📈 Métricas Derivadas

Todas estas métricas se calculan on-demand, **NO se persisten en tablas**.

### 1. Volumen por Set
Fórmula: `weight × reps` para cada set donde `is_warmup = FALSE`

### 2. Volumen Total por Workout
Fórmula: Suma de `(weight × reps)` para todos los sets de un workout, excluyendo warmups

### 3. Personal Record (PR) por Ejercicio
- PR de peso: Máximo `weight` alcanzado para un ejercicio
- PR de volumen: Máximo `(weight × reps)` alcanzado en un solo set

### 4. Estimación de 1RM (Fórmula de Epley)
Fórmula: `weight × (1 + reps / 30.0)` 
- Solo aplicable para sets con ≤ 10 reps
- Excluir warmups

### 5. Progresión Histórica
Agregar por fecha del workout:
- Peso promedio por ejercicio
- Reps promedio por ejercicio
- Volumen total por sesión
Ordenar cronológicamente descendente

---

## ⚡️ Índices y Performance

### Estrategia de Indexación

#### Índices de Búsqueda
- `users(email)` → Login frecuente
- `exercises(user_id, name)` → Búsqueda de ejercicios
- `workouts(user_id, started_at)` → Timeline de entrenamientos

#### Índices de Join
- `sets(workout_id, exercise_id)` → Queries de volume
- `routine_exercises(routine_id)` → Carga de rutinas

#### Índices Parciales (Performance)
- **Workouts activos**: Índice en `user_id` solo donde `finished_at IS NULL` (queries muy frecuentes)
- **Exercises activos**: Índice en `user_id` solo donde `is_archived = FALSE`
- **Refresh tokens válidos**: Índice en `user_id` solo donde `revoked_at IS NULL` y `expires_at > NOW()`

### Recomendaciones de Particionamiento (Futuro)

Para usuarios con +10,000 workouts, considerar particionar la tabla `sets` por año:
- Particionar por rango de fechas (ej: sets_2024, sets_2025, etc.)
- Usar particionamiento nativo de PostgreSQL por rango de `created_at`

---

## 📝 Migraciones Sugeridas

### Orden de Creación de Tablas

1. `users` (sin dependencias)
2. `refresh_tokens` (depende de users)
3. `exercises` (depende de users)
4. `routines` (depende de users)
5. `routine_exercises` (depende de routines + exercises)
6. `workouts` (depende de users + routines)
7. `sets` (depende de workouts + exercises)

### Guía de Migraciones con Prisma

**Orden recomendado de modelos en `schema.prisma`**:

1. `User` (sin dependencias)
2. `RefreshToken` (depende de User)
3. `Exercise` (depende de User)
4. `Routine` (depende de User)
5. `RoutineExercise` (depende de Routine + Exercise)
6. `Workout` (depende de User + Routine)
7. `Set` (depende de Workout + Exercise)