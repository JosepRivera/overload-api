# Autenticación · docs/api/02-auth.md

> Registro, login, renovación y cierre de sesión.

---

## Índice

- [Registro · POST /auth/register](#registro--post-authregister)
- [Login · POST /auth/login](#login--post-authlogin)
- [Refresh de token · POST /auth/refresh](#refresh-de-token--post-authrefresh)
- [Logout · POST /auth/logout](#logout--post-authlogout)

---

### Registro · POST /auth/register

> Registra un nuevo usuario y devuelve tokens de acceso.

**Autenticación:** No requiere auth

---

#### Request body

| Campo      | Tipo   | Requerido | Validación     | Descripción        |
| ---------- | ------ | --------- | -------------- | ------------------ |
| `email`    | string | ✅         | email, único   | Correo electrónico |
| `password` | string | ✅         | min 8          | Contraseña         |
| `name`     | string | ✅         | min 2, max 100 | Nombre del usuario |

---

#### Ejemplo de request

**Headers**
```
POST /auth/register
Content-Type: application/json
```

**Body**
```json
{
  "email": "nuevoqauser@overload.dev",
  "name": "QA Registro",
  "password": "Registro123"
}
```

---

#### Respuesta exitosa · `201 Created`

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YzU4ZjMzNC0xZTc4LTQxMWYtYmZmNS1iZDBiYjFiY2Y1NDAiLCJlbWFpbCI6Im51ZXZvcWF1c2VyQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1MzI5MiwiZXhwIjoxNzczMTU0MTkyfQ.j0hZMSc_I9kgQMXFK4W9T2gOSW9n9ohdLSixNT6sXYU",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YzU4ZjMzNC0xZTc4LTQxMWYtYmZmNS1iZDBiYjFiY2Y1NDAiLCJlbWFpbCI6Im51ZXZvcWF1c2VyQG92ZXJsb2FkLmRldiIsImp0aSI6ImU5ZGZhMWQxLWQ0NjAtNDYzZi05ZjJmLTVmNzkyMjE1NWJlMiIsImlhdCI6MTc3MzE1MzI5MiwiZXhwIjoxNzczNzU4MDkyfQ.gW_l6aPfIAB9FkphD0eHWTJGA_PJVeufbz93pLXUkZM",
    "user": {
      "id": "8c58f334-1e78-411f-bff5-bd0bb1bcf540",
      "email": "nuevoqauser@overload.dev",
      "name": "QA Registro",
      "is_active": true,
      "email_verified": false,
      "created_at": "2026-03-10T14:34:52.827Z",
      "updated_at": "2026-03-10T14:34:52.827Z"
    }
  }
}
```

---

#### Casos de error

| Status | Error       | Causa               |
| ------ | ----------- | ------------------- |
| 400    | Bad Request | Validación fallida  |
| 409    | Conflict    | Email ya registrado |

**400 — Validación fallida**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "origin": "string",
      "code": "invalid_format",
      "format": "email",
      "path": ["email"],
      "message": "Must be a valid email address"
    },
    {
      "origin": "string",
      "code": "too_small",
      "minimum": 2,
      "inclusive": true,
      "path": ["name"],
      "message": "Name must be at least 2 characters long"
    },
    {
      "origin": "string",
      "code": "too_small",
      "minimum": 8,
      "inclusive": true,
      "path": ["password"],
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

**409 — Email duplicado**

```json
{
  "message": "Email already in use",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Login · POST /auth/login

> Inicia sesión y devuelve tokens de autenticación.

**Autenticación:** No requiere auth

---

#### Request body

| Campo      | Tipo   | Requerido | Validación | Descripción        |
| ---------- | ------ | --------- | ---------- | ------------------ |
| `email`    | string | ✅         | email      | Correo electrónico |
| `password` | string | ✅         | min 1      | Contraseña         |

---

#### Ejemplo de request

**Headers**
```
POST /auth/login
Content-Type: application/json
```

**Body**
```json
{
  "email": "joseprivera@overload.dev",
  "password": "Train1ng123"
}
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1MzA3OSwiZXhwIjoxNzczMTUzOTc5fQ.CtgN8IZ4AN3N_19k5AvQUKqfEDTYVIJlNgVsX7lm2es",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImp0aSI6ImViNTZiNDU5LWZmZmMtNDIyNy1iZmRlLWExZGYwZTMyMjAyYiIsImlhdCI6MTc3MzE1MzA3OSwiZXhwIjoxNzczNzU3ODc5fQ.CN4HIkVbkwK68eRDnLeDsjWUekLQ1EYPBr3253O3BOc",
    "user": {
      "id": "95d40fe1-6d1d-4105-9df4-f6221f4d92b6",
      "email": "joseprivera@overload.dev",
      "name": "Josep Rivera",
      "is_active": true,
      "email_verified": false,
      "created_at": "2026-03-10T14:14:05.862Z",
      "updated_at": "2026-03-10T14:14:05.862Z"
    }
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                  |
| ------ | ------------ | ---------------------- |
| 401    | Unauthorized | Credenciales inválidas |

**401 — Credenciales inválidas**

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### Refresh de token · POST /auth/refresh

> Renueva el access token y el refresh token. El token anterior queda revocado inmediatamente.

**Autenticación:** No requiere Bearer header, pero sí un `refreshToken` válido en el body.

---

#### Request body

| Campo          | Tipo   | Requerido | Validación | Descripción          |
| -------------- | ------ | --------- | ---------- | -------------------- |
| `refreshToken` | string | ✅         | JWT válido | Refresh token activo |

---

#### Ejemplo de request

**Headers**
```
POST /auth/refresh
Content-Type: application/json
```

**Body**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImp0aSI6ImViNTZiNDU5LWZmZmMtNDIyNy1iZmRlLWExZGYwZTMyMjAyYiIsImlhdCI6MTc3MzE1MzA3OSwiZXhwIjoxNzczNzU3ODc5fQ.CN4HIkVbkwK68eRDnLeDsjWUekLQ1EYPBr3253O3BOc"
}
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImlhdCI6MTc3MzE1MzA4NSwiZXhwIjoxNzczMTUzOTg1fQ.8RBqOMoHt63bJ9Tn3KGItlFnQfA0J9XQ5EdVaVv7DrU",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImp0aSI6IjZhM2I5OTRjLTYzNTYtNDU3Yy1iZGZmLTYxN2IzZGIyODBiYyIsImlhdCI6MTc3MzE1MzA4NSwiZXhwIjoxNzczNzU3ODg1fQ.PKYYEXg3YID9802ZCpV4-dO1OWvBIGGiftwUl55ODs4"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                               |
| ------ | ------------ | ----------------------------------- |
| 401    | Unauthorized | Token inválido, expirado o revocado |

**401 — Token inválido**

```json
{
  "message": "Invalid refresh token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### Logout · POST /auth/logout

> Revoca el refresh token. El usuario deberá autenticarse de nuevo para obtener tokens nuevos.

**Autenticación:** No requiere Bearer header, pero sí un `refreshToken` válido en el body.

---

#### Request body

| Campo          | Tipo   | Requerido | Validación | Descripción          |
| -------------- | ------ | --------- | ---------- | -------------------- |
| `refreshToken` | string | ✅         | JWT válido | Refresh token activo |

---

#### Ejemplo de request

**Headers**
```
POST /auth/logout
Content-Type: application/json
```

**Body**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NWQ0MGZlMS02ZDFkLTQxMDUtOWRmNC1mNjIyMWY0ZDkyYjYiLCJlbWFpbCI6Impvc2Vwcml2ZXJhQG92ZXJsb2FkLmRldiIsImp0aSI6IjZhM2I5OTRjLTYzNTYtNDU3Yy1iZGZmLTYxN2IzZGIyODBiYyIsImlhdCI6MTc3MzE1MzA4NSwiZXhwIjoxNzczNzU3ODg1fQ.PKYYEXg3YID9802ZCpV4-dO1OWvBIGGiftwUl55ODs4"
}
```

---

#### Respuesta exitosa · `200 OK`

```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

#### Casos de error

| Status | Error        | Causa                     |
| ------ | ------------ | ------------------------- |
| 401    | Unauthorized | Token inválido o expirado |

**401 — Token inválido**

```json
{
  "message": "Invalid refresh token",
  "error": "Unauthorized",
  "statusCode": 401
}
```