# Workouts · docs/api/06-workouts.md

> Manejo de sesiones de entrenamiento (workouts): creación, finalización, consulta, listado y borrado. Garantiza un solo workout activo por usuario y controla reglas críticas de negocio.

---

## Índice

- [Iniciar workout · POST /workouts](#iniciar-workout--post-workouts)
- [Listar workouts · GET /workouts](#listar-workouts--get-workouts)
- [Workout activo · GET /workouts/active](#workout-activo--get-workoutsactive)
- [Consultar workout · GET /workouts/:id](#consultar-workout--get-workoutsid)
- [Actualizar notas · PATCH /workouts/:id](#actualizar-notas--patch-workoutsid)
- [Finalizar workout · POST /workouts/:id/finish](#finalizar-workout--post-workoutsidfinish)
- [Borrar workout · DELETE /workouts/:id](#borrar-workout--delete-workoutsid)

---

### Iniciar workout · POST /workouts

> Inicia una nueva sesión de workout para el usuario.

**Autenticación:** Requiere Bearer token

---

#### Request body

```json
{
  "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
  "started_at": "2026-03-15T22:00:00.000Z",
  "notes": "Sesión AM, energía alta."
}
```

---

#### Ejemplo de request

**Headers**
```
POST /workouts
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
Content-Type: application/json
```

---

#### Respuesta exitosa · `201 Created`

```json
{
  "data": {
    "id": "a1b2c3d4-0025-4001-a001-000000000001",
    "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
    "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
    "started_at": "2026-03-15T22:00:00.000Z",
    "finished_at": null,
    "notes": "Sesión AM, energía alta.",
    "created_at": "2026-03-15T22:00:00.000Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                                       |
| ------ | ------------ | ------------------------------------------- |
| 400    | Bad Request  | `started_at` inválido o en el futuro        |
| 401    | Unauthorized | Token ausente o inválido                    |
| 409    | Conflict     | Ya existe un workout activo para el usuario |

**409 — Ya existe workout activo**

```json
{
  "message": "You already have an active workout",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Listar workouts · GET /workouts

> Lista todos los workouts finalizados del usuario, paginados desde el más reciente.

**Autenticación:** Requiere Bearer token

---

#### Query parameters

| Parámetro | Tipo   | Requerido | Descripción                              |
| --------- | ------ | --------- | ---------------------------------------- |
| `page`    | number | No        | Página (default: 1)                      |
| `limit`   | number | No        | Ítems por página (default: 20, máx: 100) |

---

#### Ejemplo de request

**Headers**
```
GET /workouts?page=1&limit=5
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "workouts": [
      {
        "id": "a1b2c3d4-0025-4001-a001-000000000001",
        "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
        "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
        "started_at": "2026-03-15T02:46:16.282Z",
        "finished_at": "2026-03-15T02:48:17.419Z",
        "notes": null,
        "created_at": "2026-03-15T02:46:16.304Z"
      },
      {
        "id": "a1b2c3d4-0024-4001-a001-000000000001",
        "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
        "routine_id": null,
        "started_at": "2026-03-12T02:46:16.282Z",
        "finished_at": "2026-03-12T04:16:16.282Z",
        "notes": "Sin rutina, improvisado",
        "created_at": "2026-03-15T02:46:16.301Z"
      },
      {
        "id": "a1b2c3d4-0023-4001-a001-000000000001",
        "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
        "routine_id": "a1b2c3d4-0013-4001-a001-000000000001",
        "started_at": "2026-03-08T02:46:16.282Z",
        "finished_at": "2026-03-08T03:46:16.282Z",
        "notes": null,
        "created_at": "2026-03-15T02:46:16.297Z"
      },
      {
        "id": "a1b2c3d4-0022-4001-a001-000000000001",
        "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
        "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
        "started_at": "2026-03-05T02:46:16.282Z",
        "finished_at": "2026-03-05T04:01:16.282Z",
        "notes": "Buena sesión, PR en bench",
        "created_at": "2026-03-15T02:46:16.292Z"
      }
    ],
    "total": 4,
    "page": 1,
    "limit": 5
  }
}
```

---

### Workout activo · GET /workouts/active

> Devuelve el workout activo del usuario, o `null` si no existe ninguno.

**Autenticación:** Requiere Bearer token

---

#### Ejemplo de request

**Headers**
```
GET /workouts/active
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
```

---

#### Respuesta exitosa · `200 OK`

Con workout activo:
```json
{
  "data": {
    "id": "a1b2c3d4-0025-4001-a001-000000000001",
    "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
    "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
    "started_at": "2026-03-15T02:26:16.282Z",
    "finished_at": null,
    "notes": null,
    "created_at": "2026-03-15T02:46:16.304Z"
  }
}
```

Sin workout activo:
```json
{
  "data": null
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 401    | Unauthorized | Token ausente o inválido |

---

### Consultar workout · GET /workouts/:id

> Devuelve un workout específico del usuario.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción    |
| --------- | ---- | -------------- |
| `id`      | UUID | ID del workout |

---

#### Ejemplo de request

**Headers**
```
GET /workouts/a1b2c3d4-0022-4001-a001-000000000001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "a1b2c3d4-0022-4001-a001-000000000001",
    "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
    "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
    "started_at": "2026-03-05T02:46:16.282Z",
    "finished_at": "2026-03-05T04:01:16.282Z",
    "notes": "Buena sesión, PR en bench",
    "created_at": "2026-03-15T02:46:16.292Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                                       |
| ------ | ------------ | ------------------------------------------- |
| 400    | Bad Request  | UUID mal formado                            |
| 401    | Unauthorized | Token ausente o inválido                    |
| 404    | Not Found    | Workout no existe o no pertenece al usuario |

**400 — UUID mal formado**

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**404 — No existe o es de otro usuario**

```json
{
  "message": "Workout not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### Actualizar notas · PATCH /workouts/:id

> Actualiza las notas de un workout. Permitido tanto en workouts activos como finalizados.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción    |
| --------- | ---- | -------------- |
| `id`      | UUID | ID del workout |

---

#### Request body

```json
{
  "notes": "Buena sesión, PR en bench press."
}
```

---

#### Ejemplo de request

**Headers**
```
PATCH /workouts/a1b2c3d4-0022-4001-a001-000000000001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
Content-Type: application/json
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "a1b2c3d4-0022-4001-a001-000000000001",
    "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
    "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
    "started_at": "2026-03-05T02:46:16.282Z",
    "finished_at": "2026-03-05T04:01:16.282Z",
    "notes": "Buena sesión, PR en bench press.",
    "created_at": "2026-03-15T02:46:16.292Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                                       |
| ------ | ------------ | ------------------------------------------- |
| 400    | Bad Request  | UUID mal formado                            |
| 401    | Unauthorized | Token ausente o inválido                    |
| 404    | Not Found    | Workout no existe o no pertenece al usuario |

---

### Finalizar workout · POST /workouts/:id/finish

> Marca un workout activo como finalizado estableciendo `finished_at` al momento actual.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción    |
| --------- | ---- | -------------- |
| `id`      | UUID | ID del workout |

---

#### Ejemplo de request

**Headers**
```
POST /workouts/a1b2c3d4-0025-4001-a001-000000000001/finish
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "a1b2c3d4-0025-4001-a001-000000000001",
    "user_id": "a1b2c3d4-0001-4001-a001-000000000001",
    "routine_id": "a1b2c3d4-0012-4001-a001-000000000001",
    "started_at": "2026-03-15T02:26:16.282Z",
    "finished_at": "2026-03-15T02:48:17.419Z",
    "notes": null,
    "created_at": "2026-03-15T02:46:16.304Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                                           |
| ------ | ------------ | ----------------------------------------------- |
| 400    | Bad Request  | Workout ya está finalizado o supera las 6 horas |
| 401    | Unauthorized | Token ausente o inválido                        |
| 404    | Not Found    | Workout no existe o no pertenece al usuario     |

**400 — Ya está finalizado**

```json
{
  "message": "Workout is already finished",
  "error": "Bad Request",
  "statusCode": 400
}
```

**400 — Supera 6 horas**

```json
{
  "message": "Workout duration cannot exceed 6 hours",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### Borrar workout · DELETE /workouts/:id

> Elimina un workout solo si no tiene sets asociados.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción    |
| --------- | ---- | -------------- |
| `id`      | UUID | ID del workout |

---

#### Ejemplo de request

**Headers**
```
DELETE /workouts/a1b2c3d4-0025-4001-a001-000000000001
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMWIyYzNkNC0wMDAxLTQwMDEtYTAwMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzU0MzI1OSwiZXhwIjoxNzczNTQ0MTU5fQ.zU9DWTt1iElUFI7IRR43CgSALvQyzmNTu_RyCsOLHCw
```

---

#### Respuesta exitosa · `204 No Content`

_(Sin body)_

---

#### Casos de error

| Status | Error        | Causa                                              |
| ------ | ------------ | -------------------------------------------------- |
| 400    | Bad Request  | UUID mal formado                                   |
| 401    | Unauthorized | Token ausente o inválido                           |
| 404    | Not Found    | Workout no existe o no pertenece al usuario        |
| 409    | Conflict     | Workout tiene sets asociados y no puede eliminarse |

**409 — Tiene sets asociados**

```json
{
  "message": "Cannot delete workout with associated sets",
  "error": "Conflict",
  "statusCode": 409
}
```