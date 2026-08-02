---
title: Errores
description: Cada código de estado que devuelve la API, las dos formas de error que usa, y cómo manejar cada una.
---

Cada respuesta de error es JSON. Hay **dos formas distintas** según qué haya fallado — un cliente que solo parsea una de las dos se va a romper con la otra.

Todos los ejemplos de esta página se capturaron contra una instancia corriendo.

## Las dos formas

### Errores estándar

Todo excepto la validación del body del request devuelve esto:

```json
{
  "message": "Exercise not found",
  "error": "Not Found",
  "statusCode": 404
}
```

| Campo         | Tipo      | Notas                                      |
| -------------- | ----------- | --------------------------------------------- |
| `message`         | string        | Descripción legible por humanos                    |
| `error`            | string        | El nombre del status HTTP                             |
| `statusCode`       | integer       | El código de estado HTTP                                |

### Errores de validación

Cuando el body de un request falla la validación de schema, la forma cambia — **no hay campo `error`**, y el detalle vive en un array `errors`:

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
      "expected": "string",
      "code": "invalid_type",
      "path": ["name"],
      "message": "Invalid input: expected string, received undefined"
    }
  ]
}
```

| Campo                   | Tipo       | Notas                                              |
| -------------------------- | ------------ | -------------------------------------------------------- |
| `message`                     | string          | Siempre `"Validation failed"`                                 |
| `errors[].path`                | array           | Path al campo problemático                                       |
| `errors[].message`             | string          | Mensaje para ese campo                                             |
| `errors[].code`                | string          | Tipo de fallo, legible por máquina                                    |

:::note[Manejar ambas]
Ramifica según la presencia de `errors`. Si existe, el body del request era inválido y puedes mapear cada entrada a un campo de formulario vía su `path`. Si no, muestra `message`.
:::

:::caution[Las entradas de validación traen campos extra]
Las entradas de `errors` pueden incluir metadata de schema adicional más allá de los campos documentados acá — incluyendo el patrón de validación crudo. Trata `path`, `message` y `code` como el contrato estable e ignora el resto.
:::

---

## Códigos de estado

| Código  | Significado    | Causa típica                                                          |
| -------- | ---------------- | -------------------------------------------------------------------------- |
| `200`      | OK                 | GET o PATCH exitoso, y `POST /auth/login`                                     |
| `201`      | Created            | Un POST que creó un recurso                                                     |
| `204`      | No Content         | Un DELETE exitoso — sin body                                                      |
| `400`      | Bad Request        | El body falló la validación, o un path parameter no es un UUID válido                |
| `401`      | Unauthorized       | Access token ausente, mal formado o expirado; credenciales incorrectas                  |
| `403`      | Forbidden          | Autenticado, pero el recurso pertenece a otro usuario                                    |
| `404`      | Not Found          | El recurso no existe, o no te pertenece                                                    |
| `409`      | Conflict           | El request contradice el estado actual — ver abajo                                          |

---

## Errores por situación

### 400 — Bad Request

UUID mal formado en el path:

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

Nota que usa la forma **estándar**, no la de validación — los path parameters y los request bodies se validan en capas distintas.

Un body de `PATCH` vacío también devuelve `400`: todo endpoint de actualización requiere al menos un campo.

### 401 — Unauthorized

```json
{ "message": "No token provided", "error": "Unauthorized", "statusCode": 401 }
```

```json
{ "message": "Invalid or expired token", "error": "Unauthorized", "statusCode": 401 }
```

`Invalid or expired token` es el que hay que manejar en un cliente: refresca una vez, y reintenta. Ver [Autenticación](/es/guides/authentication/).

También se devuelve ante credenciales de login incorrectas, y ante un refresh token expirado, revocado o ya usado.

### 403 — Forbidden

Se devuelve cuando estás autenticado pero el recurso no te pertenece:

```json
{
  "message": "Cannot access another user's profile",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 — Not Found

```json
{ "message": "Exercise not found", "error": "Not Found", "statusCode": 404 }
```

La mayoría de los recursos devuelven `404` en lugar de `403` cuando pertenecen a otro usuario — el filtro de propiedad corre como parte de la búsqueda, así que el recurso directamente no se encuentra para ti.

Las rutas que no matchean devuelven la misma forma:

```json
{ "message": "Cannot GET /nada-aca", "error": "Not Found", "statusCode": 404 }
```

### 409 — Conflict

El estado de tus datos contradice el request. Este es el que conviene leer con cuidado, porque la causa cambia según el endpoint:

| Mensaje                                            | Causa                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `Email already in use`                                    | Registrarse con un email que ya existe                                 |
| `Cannot add sets to a finished workout`                    | El workout tiene `finished_at` seteado                                  |
| `Cannot modify sets of a finished workout`                 | Lo mismo, en `PATCH`                                                     |
| `Cannot remove sets of a finished workout`                 | Lo mismo, en `DELETE`                                                     |
| `Cannot log sets for an archived exercise`                 | El ejercicio tiene `is_archived = true`                                     |

Un nombre de ejercicio activo duplicado también devuelve `409`.

---

## Lo que todavía no está implementado

:::caution
Esto se documenta acá para que quien escriba un cliente no se lleve una sorpresa después.

- **No hay `429 Too Many Requests`.** El rate limiting todavía no existe — `/auth/login` acepta hoy intentos ilimitados.
- **No hay ID de correlación de request.** Las respuestas de error no llevan ningún identificador que puedas citar en un reporte de bug.
- **Dos formas, no una.** Los errores de validación y los errores estándar difieren, como se documentó arriba. Un futuro filtro de excepciones global podría unificarlos; hasta entonces, maneja ambas.
:::

## Relacionado

- [Convenciones de la API](/es/architecture/api-conventions/) — envoltorio de respuesta y reglas de URL
- [Autenticación](/es/guides/authentication/) — el flujo de recuperación de `401`
