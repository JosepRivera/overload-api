---
title: Usuarios
description: Consulta del perfil propio.
---

**Base:** `/users`
**Autenticación:** requerida en todos los endpoints

Todavía no existe forma de actualizar el perfil — ver la nota de [huecos del MVP](/es/architecture/business-rules/) si buscas un `PATCH`.

---

## Obtener el usuario actual

```
GET /users/me
```

Devuelve el usuario autenticado, sin incluir nunca `password_hash`.

**Respuesta `200`**

```json
{
  "data": {
    "id": "95d40fe1-…",
    "email": "tu@ejemplo.com",
    "name": "Tu Nombre",
    "is_active": true,
    "email_verified": false,
    "created_at": "2026-03-10T14:14:05.862Z",
    "updated_at": "2026-03-10T14:14:05.862Z"
  }
}
```

| Status | Cuándo                     |
| ------ | ---------------------------- |
| `200`  | Éxito                          |
| `401`  | Token ausente o inválido        |

---

## Obtener un usuario por ID

```
GET /users/:id
```

Solo puedes consultar tu propio perfil — `id` debe coincidir con el del usuario autenticado.

| Status | Cuándo                                |
| ------ | ---------------------------------------- |
| `200`  | Éxito                                       |
| `400`  | `id` no es un UUID válido                    |
| `401`  | Token ausente o inválido                     |
| `403`  | `id` pertenece a otro usuario                 |

## Relacionado

- [Errores](/es/reference/errors/)
