# Usuarios · docs/api/03-users.md

> Consulta de perfil de usuario.

---

## Índice

- [Perfil propio · GET /users/me](#perfil-propio--get-usersme)
- [Perfil por ID · GET /users/:id](#perfil-por-id--get-usersid)

---

### Perfil propio · GET /users/me

> Devuelve el perfil del usuario autenticado sin exponer el password hash.

**Autenticación:** Requiere Bearer token

---

#### Ejemplo de request

**Headers**
```
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1MzA3OSwiZXhwIjoxNzczMTUzOTc5fQ.CtgN8IZ4AN3N_19k5AvQUKqfEDTYVIJlNgVsX7lm2es
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "email": "joseprivera@overload.dev",
    "name": "Josep Rivera",
    "is_active": true,
    "email_verified": false,
    "created_at": "2026-03-10T14:14:05.862Z",
    "updated_at": "2026-03-10T14:14:05.862Z"
  }
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

### Perfil por ID · GET /users/:id

> Devuelve el perfil de un usuario por su ID. Solo se puede consultar el propio perfil.

**Autenticación:** Requiere Bearer token

---

#### Parámetros de ruta

| Parámetro | Tipo | Descripción    |
| --------- | ---- | -------------- |
| `id`      | UUID | ID del usuario |

---

#### Ejemplo de request

**Headers**
```
GET /users/95d40fe1-6d1d-4105-9df4-f6221f4d92b6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1MzA3OSwiZXhwIjoxNzczMTUzOTc5fQ.CtgN8IZ4AN3N_19k5AvQUKqfEDTYVIJlNgVsX7lm2es
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
    "email": "joseprivera@overload.dev",
    "name": "Josep Rivera",
    "is_active": true,
    "email_verified": false,
    "created_at": "2026-03-10T14:14:05.862Z",
    "updated_at": "2026-03-10T14:14:05.862Z"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                    |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | UUID mal formado         |
| 401    | Unauthorized | Token ausente o inválido |
| 403    | Forbidden    | Acceso a perfil ajeno    |

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

**403 — Perfil ajeno**

```json
{
  "message": "Cannot access another user's profile",
  "error": "Forbidden",
  "statusCode": 403
}
```