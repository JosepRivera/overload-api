# Ejercicios · docs/api/04-exercises.md

> Catálogo personal de ejercicios del usuario.

---

## Índice

- [Crear · POST /exercises](#crear--post-exercises)
- [Listar · GET /exercises](#listar--get-exercises)
- [Obtener por ID · GET /exercises/:id](#obtener-por-id--get-exercisesid)
- [Actualizar · PATCH /exercises/:id](#actualizar--patch-exercisesid)
- [Archivar · PATCH /exercises/:id/archive](#archivar--patch-exercisesidarchive)

---

### Crear · POST /exercises

> Crea un nuevo ejercicio en el catálogo personal del usuario.

**Autenticación:** Requiere Bearer token

---

#### Request body

| Campo      | Tipo   | Requerido | Validación                                              | Descripción        |
| ---------- | ------ | --------- | ------------------------------------------------------- | ------------------ |
| `name`     | string | ✅         | min 1, max 150                                          | Nombre único       |
| `category` | string | ✅         | chest, back, legs, shoulders, arms, core, cardio, other | Grupo muscular     |
| `type`     | string | ✅         | compound, isolation, cardio, stretching                 | Tipo de movimiento |
| `notes`    | string | ❌         | max 2000                                                | Notas opcionales   |

---

#### Ejemplo de request

**Headers**
```
POST /exercises
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1Mzc1MCwiZXhwIjoxNzczMTU0NjUwfQ.NI9FFxdkTbazskQjVwMKShcLtjjIqtdMMV9ysGSTx0o
```

**Body**
```json
{
  "name": "Press de banca",
  "category": "chest",
  "type": "compound",
  "notes": "Ejercicio principal para pecho."
}
```

---

#### Respuesta exitosa · `201 Created`

```json
{
  "data": {
    "id": "f1013006-25df-43b9-ae9f-3dd45d0394e0",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Press de banca",
    "category": "chest",
    "type": "compound",
    "notes": "Ejercicio principal para pecho.",
    "is_archived": false,
    "created_at": "2026-03-10T14:42:44.468Z",
    "updated_at": "2026-03-10T14:42:44.468Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                           |
| ------ | ------------ | ------------------------------- |
| 400    | Bad Request  | Validación fallida              |
| 401    | Unauthorized | Token ausente o inválido        |
| 409    | Conflict     | Nombre duplicado (no archivado) |

**400 — Validación fallida**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_value",
      "values": ["chest","back","legs","shoulders","arms","core","cardio","other"],
      "path": ["category"],
      "message": "Invalid option: expected one of \"chest\"|\"back\"|\"legs\"|\"shoulders\"|\"arms\"|\"core\"|\"cardio\"|\"other\""
    },
    {
      "code": "invalid_value",
      "values": ["compound","isolation","cardio","stretching"],
      "path": ["type"],
      "message": "Invalid option: expected one of \"compound\"|\"isolation\"|\"cardio\"|\"stretching\""
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
  "message": "You already have an active exercise with this name",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Listar · GET /exercises

> Lista todos los ejercicios del usuario. Por defecto excluye los archivados.

**Autenticación:** Requiere Bearer token

---

#### Query parameters

| Parámetro         | Tipo    | Requerido | Default | Descripción                          |
| ----------------- | ------- | --------- | ------- | ------------------------------------ |
| `includeArchived` | boolean | ❌         | false   | Si es `true`, incluye los archivados |

---

#### Ejemplo de request

**Headers**
```
GET /exercises
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1Mzc1MCwiZXhwIjoxNzczMTU0NjUwfQ.NI9FFxdkTbazskQjVwMKShcLtjjIqtdMMV9ysGSTx0o
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": [
    {
      "id": "69d6a8b9-f2d3-492d-afd7-7fdd2375862b",
      "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
      "name": "Barbell Back Squat",
      "category": "legs",
      "type": "compound",
      "notes": null,
      "is_archived": false,
      "created_at": "2026-03-10T14:15:08.499Z",
      "updated_at": "2026-03-10T14:15:08.499Z"
    },
    {
      "id": "f1013006-25df-43b9-ae9f-3dd45d0394e0",
      "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
      "name": "Press de banca",
      "category": "chest",
      "type": "compound",
      "notes": "Ejercicio principal para pecho.",
      "is_archived": false,
      "created_at": "2026-03-10T14:42:44.468Z",
      "updated_at": "2026-03-10T14:42:44.468Z"
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

### Obtener por ID · GET /exercises/:id

> Devuelve un ejercicio por su ID, incluyendo archivados.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción      |
| --------- | ---- | ---------------- |
| `id`      | UUID | ID del ejercicio |

---

#### Ejemplo de request

**Headers**
```
GET /exercises/f1013006-25df-43b9-ae9f-3dd45d0394e0
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1Mzc1MCwiZXhwIjoxNzczMTU0NjUwfQ.NI9FFxdkTbazskQjVwMKShcLtjjIqtdMMV9ysGSTx0o
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "f1013006-25df-43b9-ae9f-3dd45d0394e0",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Press de banca",
    "category": "chest",
    "type": "compound",
    "notes": "Ejercicio principal para pecho.",
    "is_archived": false,
    "created_at": "2026-03-10T14:42:44.468Z",
    "updated_at": "2026-03-10T14:42:44.468Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 404    | Not Found    | Ejercicio no encontrado  |

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

**404 — Ejercicio no encontrado**

```json
{
  "message": "Exercise not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Actualizar · PATCH /exercises/:id

> Actualiza parcialmente los datos de un ejercicio. Todos los campos son opcionales.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción      |
| --------- | ---- | ---------------- |
| `id`      | UUID | ID del ejercicio |

---

#### Request body

| Campo      | Tipo   | Requerido | Validación                                              | Descripción        |
| ---------- | ------ | --------- | ------------------------------------------------------- | ------------------ |
| `name`     | string | ❌         | min 1, max 150                                          | Nuevo nombre       |
| `category` | string | ❌         | chest, back, legs, shoulders, arms, core, cardio, other | Grupo muscular     |
| `type`     | string | ❌         | compound, isolation, cardio, stretching                 | Tipo de movimiento |
| `notes`    | string | ❌         | max 2000                                                | Notas              |

---

#### Ejemplo de request

**Headers**
```
PATCH /exercises/f1013006-25df-43b9-ae9f-3dd45d0394e0
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1Mzc1MCwiZXhwIjoxNzczMTU0NjUwfQ.NI9FFxdkTbazskQjVwMKShcLtjjIqtdMMV9ysGSTx0o
```

**Body**
```json
{
  "notes": "Modificado: variante con mancuernas."
}
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "f1013006-25df-43b9-ae9f-3dd45d0394e0",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Press de banca",
    "category": "chest",
    "type": "compound",
    "notes": "Modificado: variante con mancuernas.",
    "is_archived": false,
    "created_at": "2026-03-10T14:42:44.468Z",
    "updated_at": "2026-03-10T14:43:18.598Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 404    | Not Found    | Ejercicio no encontrado  |
| 409    | Conflict     | Nombre duplicado         |

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

**404 — Ejercicio no encontrado**

```json
{
  "message": "Exercise not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**409 — Nombre duplicado**

```json
{
  "message": "You already have an active exercise with this name",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Archivar · PATCH /exercises/:id/archive

> Archiva un ejercicio (soft delete). Deja de aparecer en el catálogo activo pero se conserva en el historial.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción      |
| --------- | ---- | ---------------- |
| `id`      | UUID | ID del ejercicio |

---

#### Ejemplo de request

**Headers**
```
PATCH /exercises/f1013006-25df-43b9-ae9f-3dd45d0394e0/archive
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1Mzc1MCwiZXhwIjoxNzczMTU0NjUwfQ.NI9FFxdkTbazskQjVwMKShcLtjjIqtdMMV9ysGSTx0o
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "f1013006-25df-43b9-ae9f-3dd45d0394e0",
    "user_id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "name": "Press de banca",
    "category": "chest",
    "type": "compound",
    "notes": "Modificado: variante con mancuernas.",
    "is_archived": true,
    "created_at": "2026-03-10T14:42:44.468Z",
    "updated_at": "2026-03-10T14:43:30.527Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 404    | Not Found    | Ejercicio no encontrado  |

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

**404 — Ejercicio no encontrado**

```json
{
  "message": "Exercise not found",
  "error": "Not Found",
  "statusCode": 404
}
```