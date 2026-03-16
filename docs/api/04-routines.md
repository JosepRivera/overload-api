# Rutinas · docs/api/05-routines.md

> Gestión de planes de entrenamiento y sus ejercicios.

---

## Índice

- [Crear · POST /routines](#crear--post-routines)
- [Listar · GET /routines](#listar--get-routines)
- [Obtener por ID · GET /routines/:id](#obtener-por-id--get-routinesid)
- [Actualizar · PATCH /routines/:id](#actualizar--patch-routinesid)
- [Desactivar · DELETE /routines/:id](#desactivar--delete-routinesid)
- [Agregar ejercicio · POST /routines/:id/exercises](#agregar-ejercicio--post-routinesidexercises)
- [Listar ejercicios · GET /routines/:id/exercises](#listar-ejercicios--get-routinesidexercises)
- [Actualizar ejercicio · PATCH /routines/:id/exercises/:exerciseId](#actualizar-ejercicio--patch-routinesidexercisesexerciseid)
- [Eliminar ejercicio · DELETE /routines/:id/exercises/:exerciseId](#eliminar-ejercicio--delete-routinesidexercisesexerciseid)
- [Reordenar ejercicios · POST /routines/:id/exercises/reorder](#reordenar-ejercicios--post-routinesidexercisesreorder)

---

### Crear · POST /routines

> Crea una nueva rutina de entrenamiento para el usuario.

**Autenticación:** Requiere Bearer token

---

#### Request body

| Campo         | Tipo   | Requerido | Validación     | Descripción          |
| ------------- | ------ | --------- | -------------- | -------------------- |
| `name`        | string | ✅         | min 1, max 150 | Nombre de la rutina  |
| `description` | string | ❌         | max 2000       | Descripción opcional |

---

#### Ejemplo de request

**Headers**
```
POST /routines
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

**Body**
```json
{
  "name": "Rutina de pecho",
  "description": "Entrenamiento de fuerza para pecho"
}
```

---

#### Respuesta exitosa · `201 Created`

```json
{
  "data": {
    "id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Rutina de pecho",
    "description": "Entrenamiento de fuerza para pecho",
    "is_active": true,
    "created_at": "2026-03-10T21:46:14.882Z",
    "updated_at": "2026-03-10T21:46:14.882Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                      |
| ------ | ------------ | -------------------------- |
| 400    | Bad Request  | Validación fallida         |
| 401    | Unauthorized | Token ausente o inválido   |
| 409    | Conflict     | Nombre de rutina duplicado |

**400 — Validación fallida**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "origin": "string",
      "code": "too_small",
      "minimum": 1,
      "inclusive": true,
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**409 — Nombre duplicado**

```json
{
  "message": "You already have an active routine with this name",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Listar · GET /routines

> Lista todas las rutinas activas del usuario, ordenadas por nombre.

**Autenticación:** Requiere Bearer token

---

#### Ejemplo de request

**Headers**
```
GET /routines
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": [
    {
      "id": "8fa2a955-4f88-4377-8695-1dc775b9649e",
      "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
      "name": "Lower Body B",
      "description": "Squat and deadlift focus",
      "is_active": true,
      "created_at": "2026-03-10T14:15:15.395Z",
      "updated_at": "2026-03-10T14:15:15.395Z"
    },
    {
      "id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
      "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
      "name": "Rutina de pecho",
      "description": "Entrenamiento de fuerza para pecho",
      "is_active": true,
      "created_at": "2026-03-10T21:46:14.882Z",
      "updated_at": "2026-03-10T21:46:14.882Z"
    }
  ]
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 401    | Unauthorized | Token ausente o inválido |

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### Obtener por ID · GET /routines/:id

> Obtiene los detalles de una rutina incluyendo todos sus ejercicios configurados, ordenados por `order_index`.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID de la rutina |

---

#### Ejemplo de request

**Headers**
```
GET /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Rutina de pecho",
    "description": "Entrenamiento de fuerza para pecho",
    "is_active": true,
    "created_at": "2026-03-10T21:46:14.882Z",
    "updated_at": "2026-03-10T21:46:14.882Z",
    "routine_exercises": [
      {
        "id": "ffb57e02-6201-4e3a-913a-ededfa5d6c92",
        "routine_id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
        "exercise_id": "0f68b97a-692a-4844-a12c-95e17c98e278",
        "target_sets": 4,
        "target_reps_min": 8,
        "target_reps_max": 12,
        "target_rest_sec": 120,
        "order_index": 0,
        "notes": null,
        "exercise": {
          "id": "0f68b97a-692a-4844-a12c-95e17c98e278",
          "name": "Press de banca",
          "category": "chest",
          "type": "compound",
          "is_archived": false
        }
      }
    ]
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 404    | Not Found    | Rutina no encontrada     |

**400 — UUID mal formado**

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Actualizar · PATCH /routines/:id

> Actualiza el nombre y/o descripción de una rutina. Todos los campos son opcionales.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID de la rutina |

---

#### Request body

| Campo         | Tipo   | Requerido | Validación     | Descripción       |
| ------------- | ------ | --------- | -------------- | ----------------- |
| `name`        | string | ❌         | min 1, max 150 | Nuevo nombre      |
| `description` | string | ❌         | max 2000       | Nueva descripción |

---

#### Ejemplo de request

**Headers**
```
PATCH /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

**Body**
```json
{
  "name": "Rutina de pecho actualizada",
  "description": "Nueva descripción"
}
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Rutina de pecho actualizada",
    "description": "Nueva descripción",
    "is_active": true,
    "created_at": "2026-03-10T21:46:14.882Z",
    "updated_at": "2026-03-10T21:46:30.023Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                      |
| ------ | ------------ | -------------------------- |
| 400    | Bad Request  | UUID mal formado           |
| 401    | Unauthorized | Token ausente o inválido   |
| 404    | Not Found    | Rutina no encontrada       |
| 409    | Conflict     | Nombre de rutina duplicado |

**400 — UUID mal formado**

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**409 — Nombre duplicado**

```json
{
  "message": "You already have an active routine with this name",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Desactivar · DELETE /routines/:id

> Desactiva una rutina (soft delete). La rutina deja de aparecer en el listado activo pero se conserva en la base de datos.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID de la rutina |

---

#### Ejemplo de request

**Headers**
```
DELETE /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

---

#### Respuesta exitosa · `204 No Content`

Sin body.

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 404    | Not Found    | Rutina no encontrada     |

**400 — UUID mal formado**

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Agregar ejercicio · POST /routines/:id/exercises

> Agrega un ejercicio activo a una rutina con su configuración objetivo. El `order_index` se asigna automáticamente al final de la lista.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID de la rutina |

---

#### Request body

| Campo             | Tipo   | Requerido | Validación                        | Descripción                   |
| ----------------- | ------ | --------- | --------------------------------- | ----------------------------- |
| `exercise_id`     | UUID   | ✅         | UUID válido                       | ID del ejercicio              |
| `target_sets`     | number | ✅         | entero, min 1                     | Series objetivo               |
| `target_reps_min` | number | ✅         | entero, min 1                     | Repeticiones mínimas objetivo |
| `target_reps_max` | number | ✅         | entero, min 1, >= target_reps_min | Repeticiones máximas objetivo |
| `target_rest_sec` | number | ✅         | entero, min 0                     | Descanso en segundos          |
| `notes`           | string | ❌         | max 2000                          | Notas opcionales              |

---

#### Ejemplo de request

**Headers**
```
POST /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6/exercises
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

**Body**
```json
{
  "exercise_id": "0f68b97a-692a-4844-a12c-95e17c98e278",
  "target_sets": 4,
  "target_reps_min": 8,
  "target_reps_max": 12,
  "target_rest_sec": 120
}
```

---

#### Respuesta exitosa · `201 Created`

```json
{
  "data": {
    "id": "ffb57e02-6201-4e3a-913a-ededfa5d6c92",
    "routine_id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
    "exercise_id": "0f68b97a-692a-4844-a12c-95e17c98e278",
    "target_sets": 4,
    "target_reps_min": 8,
    "target_reps_max": 12,
    "target_rest_sec": 120,
    "order_index": 0,
    "notes": null
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                            |
| ------ | ------------ | -------------------------------- |
| 400    | Bad Request  | Validación fallida               |
| 401    | Unauthorized | Token ausente o inválido         |
| 404    | Not Found    | Rutina o ejercicio no encontrado |
| 409    | Conflict     | Ejercicio ya existe en la rutina |

**400 — Validación fallida**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "expected": "number",
      "code": "invalid_type",
      "path": ["target_sets"],
      "message": "Invalid input: expected number, received undefined"
    }
  ]
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**404 — Ejercicio no encontrado o archivado**

```json
{
  "message": "Exercise not found or is archived",
  "error": "Not Found",
  "statusCode": 404
}
```

**409 — Ejercicio duplicado en la rutina**

```json
{
  "message": "This exercise is already in the routine",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Listar ejercicios · GET /routines/:id/exercises

> Lista todos los ejercicios de una rutina ordenados por `order_index`, incluyendo los datos del ejercicio.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID de la rutina |

---

#### Ejemplo de request

**Headers**
```
GET /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6/exercises
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": [
    {
      "id": "ffb57e02-6201-4e3a-913a-ededfa5d6c92",
      "routine_id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
      "exercise_id": "0f68b97a-692a-4844-a12c-95e17c98e278",
      "target_sets": 4,
      "target_reps_min": 8,
      "target_reps_max": 12,
      "target_rest_sec": 120,
      "order_index": 0,
      "notes": null,
      "exercise": {
        "id": "0f68b97a-692a-4844-a12c-95e17c98e278",
        "name": "Press de banca",
        "category": "chest",
        "type": "compound",
        "is_archived": false
      }
    },
    {
      "id": "0076ae59-6ce1-4116-9f07-43aae60a450a",
      "routine_id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
      "exercise_id": "2834949f-a8d0-4982-9639-9353c27e3019",
      "target_sets": 3,
      "target_reps_min": 6,
      "target_reps_max": 10,
      "target_rest_sec": 180,
      "order_index": 1,
      "notes": null,
      "exercise": {
        "id": "2834949f-a8d0-4982-9639-9353c27e3019",
        "name": "Sentadilla",
        "category": "legs",
        "type": "compound",
        "is_archived": false
      }
    }
  ]
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 404    | Not Found    | Rutina no encontrada     |

**400 — UUID mal formado**

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Actualizar ejercicio · PATCH /routines/:id/exercises/:exerciseId

> Actualiza parcialmente la configuración de un ejercicio dentro de una rutina. Todos los campos son opcionales.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro    | Tipo | Descripción                   |
| ------------ | ---- | ----------------------------- |
| `id`         | UUID | ID de la rutina               |
| `exerciseId` | UUID | ID del ejercicio en la rutina |

---

#### Request body

| Campo             | Tipo   | Requerido | Validación                        | Descripción                   |
| ----------------- | ------ | --------- | --------------------------------- | ----------------------------- |
| `target_sets`     | number | ❌         | entero, min 1                     | Series objetivo               |
| `target_reps_min` | number | ❌         | entero, min 1                     | Repeticiones mínimas objetivo |
| `target_reps_max` | number | ❌         | entero, min 1, >= target_reps_min | Repeticiones máximas objetivo |
| `target_rest_sec` | number | ❌         | entero, min 0                     | Descanso en segundos          |
| `notes`           | string | ❌         | max 2000                          | Notas opcionales              |

---

#### Ejemplo de request

**Headers**
```
PATCH /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6/exercises/ffb57e02-6201-4e3a-913a-ededfa5d6c92
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

**Body**
```json
{
  "target_sets": 5,
  "target_reps_min": 6,
  "target_reps_max": 10
}
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "ffb57e02-6201-4e3a-913a-ededfa5d6c92",
    "routine_id": "4cabdb72-3c14-4cc2-9f30-b951dd5f67d6",
    "exercise_id": "0f68b97a-692a-4844-a12c-95e17c98e278",
    "target_sets": 5,
    "target_reps_min": 6,
    "target_reps_max": 10,
    "target_rest_sec": 120,
    "order_index": 0,
    "notes": null
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                            |
| ------ | ------------ | -------------------------------- |
| 400    | Bad Request  | Validación fallida               |
| 401    | Unauthorized | Token ausente o inválido         |
| 404    | Not Found    | Rutina o ejercicio no encontrado |

**400 — Validación fallida**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "origin": "number",
      "code": "too_small",
      "minimum": 1,
      "inclusive": true,
      "path": ["target_sets"],
      "message": "target_sets must be at least 1"
    }
  ]
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**404 — Ejercicio no encontrado en la rutina**

```json
{
  "message": "Exercise not found in this routine",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Eliminar ejercicio · DELETE /routines/:id/exercises/:exerciseId

> Elimina un ejercicio de una rutina. No afecta el ejercicio en sí ni su historial.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro    | Tipo | Descripción                   |
| ------------ | ---- | ----------------------------- |
| `id`         | UUID | ID de la rutina               |
| `exerciseId` | UUID | ID del ejercicio en la rutina |

---

#### Ejemplo de request

**Headers**
```
DELETE /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6/exercises/0076ae59-6ce1-4116-9f07-43aae60a450a
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

---

#### Respuesta exitosa · `204 No Content`

Sin body.

---

#### Casos de error

| Status | Error        | Causa                            |
| ------ | ------------ | -------------------------------- |
| 400    | Bad Request  | UUID mal formado                 |
| 401    | Unauthorized | Token ausente o inválido         |
| 404    | Not Found    | Rutina o ejercicio no encontrado |

**400 — UUID mal formado**

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**404 — Ejercicio no encontrado en la rutina**

```json
{
  "message": "Exercise not found in this routine",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Reordenar ejercicios · POST /routines/:id/exercises/reorder

> Actualiza el `order_index` de todos los ejercicios de una rutina en una sola operación atómica.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción     |
| --------- | ---- | --------------- |
| `id`      | UUID | ID de la rutina |

---

#### Request body

| Campo       | Tipo  | Requerido | Validación                            | Descripción              |
| ----------- | ----- | --------- | ------------------------------------- | ------------------------ |
| `exercises` | array | ✅         | min 1, IDs únicos, order_index únicos | Array con el nuevo orden |

Cada objeto del array:

| Campo         | Tipo   | Requerido | Validación    | Descripción                   |
| ------------- | ------ | --------- | ------------- | ----------------------------- |
| `id`          | UUID   | ✅         | UUID válido   | ID del ejercicio en la rutina |
| `order_index` | number | ✅         | entero, min 0 | Nuevo índice de orden         |

---

#### Ejemplo de request

**Headers**
```
POST /routines/4cabdb72-3c14-4cc2-9f30-b951dd5f67d6/exercises/reorder
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1NDEyNSwiZXhwIjoxNzczMTU1MDI1fQ.5GSUgakdoCh3ldvXMzePT1_KbTItfjyGqce72Chvops
```

**Body**
```json
{
  "exercises": [
    {
      "id": "0076ae59-6ce1-4116-9f07-43aae60a450a",
      "order_index": 0
    },
    {
      "id": "ffb57e02-6201-4e3a-913a-ededfa5d6c92",
      "order_index": 1
    }
  ]
}
```

---

#### Respuesta exitosa · `200 OK`

Sin body.

---

#### Casos de error

| Status | Error        | Causa                                              |
| ------ | ------------ | -------------------------------------------------- |
| 400    | Bad Request  | Validación fallida o IDs no pertenecen a la rutina |
| 401    | Unauthorized | Token ausente o inválido                           |
| 404    | Not Found    | Rutina no encontrada                               |

**400 — Array vacío**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "origin": "array",
      "code": "too_small",
      "minimum": 1,
      "inclusive": true,
      "path": ["exercises"],
      "message": "exercises array must not be empty"
    }
  ]
}
```

**400 — IDs no pertenecen a la rutina**

```json
{
  "message": "One or more exercise IDs do not belong to this routine",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 — Sin token**

```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 — Rutina no encontrada**

```json
{
  "message": "Routine not found",
  "error": "Not Found",
  "statusCode": 404
}
```