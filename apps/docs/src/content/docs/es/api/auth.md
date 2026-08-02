---
title: Auth
description: Registro, login, refresh y revocación de sesión.
---

**Base:** `/auth`
**Autenticación:** ninguno de estos endpoints requiere token — `refresh` y `logout` requieren un `refreshToken` válido en el body en su lugar.

Ver [Autenticación](/es/guides/authentication/) para el ciclo completo de tokens y cómo manejar la expiración en un cliente.

---

## Registro

```
POST /auth/register
```

Crea un usuario y lo loguea de inmediato — no hace falta llamar a login por separado.

**Body**

```json
{
  "email": "tu@ejemplo.com",
  "name": "Tu Nombre",
  "password": "minimo-8-caracteres"
}
```

| Campo      | Requerido | Regla                     |
| ---------- | --------- | --------------------------- |
| `email`    | sí        | Email válido, único           |
| `name`     | sí        | 2–100 caracteres              |
| `password` | sí        | 8+ caracteres                  |

**Respuesta `201`**

```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "95d40fe1-…",
      "email": "tu@ejemplo.com",
      "name": "Tu Nombre",
      "is_active": true,
      "email_verified": false,
      "created_at": "2026-03-10T14:14:05.862Z",
      "updated_at": "2026-03-10T14:14:05.862Z"
    }
  }
}
```

| Status | Cuándo                        |
| ------ | ------------------------------ |
| `201`  | Usuario creado y logueado        |
| `400`  | Validación fallida                |
| `409`  | Email ya registrado                |

---

## Login

```
POST /auth/login
```

**Body**

```json
{ "email": "tu@ejemplo.com", "password": "minimo-8-caracteres" }
```

**Respuesta `200`** — misma forma que el registro.

| Status | Cuándo                 |
| ------ | ----------------------- |
| `200`  | Éxito                     |
| `401`  | Credenciales inválidas     |

---

## Refresh

```
POST /auth/refresh
```

Intercambia un refresh token válido por un nuevo par access/refresh. Rota el par — el token que enviaste queda revocado en el instante en que se emite el nuevo.

**Body**

```json
{ "refreshToken": "<jwt>" }
```

**Respuesta `200`**

```json
{ "data": { "accessToken": "<jwt>", "refreshToken": "<jwt>" } }
```

| Status | Cuándo                                              |
| ------ | ------------------------------------------------------ |
| `200`  | Nuevo par emitido                                        |
| `401`  | Refresh token inválido, expirado, revocado o reutilizado |

---

## Logout

```
POST /auth/logout
```

Revoca el refresh token indicado de inmediato. El access token asociado sigue válido hasta que expira — hasta 15 minutos después.

**Body**

```json
{ "refreshToken": "<jwt>" }
```

**Respuesta `200`**

```json
{ "data": { "message": "Logged out successfully" } }
```

| Status | Cuándo                          |
| ------ | --------------------------------- |
| `200`  | Token revocado                      |
| `401`  | Refresh token inválido o expirado    |

---

## Relacionado

- [Guía de autenticación](/es/guides/authentication/) — el ciclo completo, límites de sesión y el patrón de manejo de 401
- [Errores](/es/reference/errors/)
