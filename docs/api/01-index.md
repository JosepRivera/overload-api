# Overload API — Documentación de Endpoints

> Referencia completa de todos los endpoints del API. Cada módulo tiene su propio archivo con ejemplos reales de requests y responses.

---

## Módulos

| #   | Archivo                           | Descripción                             |
| --- | --------------------------------- | --------------------------------------- |
| 1   | [auth.md](./02-auth.md)           | Registro, login, refresh y logout       |
| 2   | [users.md](./03-users.md)         | Perfil de usuario                       |
| 3   | [exercises.md](./04-exercises.md) | Catálogo personal de ejercicios         |
| 4   | [routines.md](./05-routines.md)   | Planes de entrenamiento                 |
| 5   | [workouts.md](./06-workouts.md)   | Sesiones de entrenamiento _(pendiente)_ |
| 6   | [analytics.md](./07-analytics.md) | PRs, volumen y 1RM _(pendiente)_        |

---

## Base URL

```
http://localhost:3000       # desarrollo
https://api.overload.com   # producción
```

Documentación interactiva (Swagger): `http://localhost:3000/api/docs`

---

## Autenticación

Todos los endpoints excepto `POST /auth/register` y `POST /auth/login` requieren un access token válido.

**Header requerido:**
```
Authorization: Bearer <accessToken>
```

**Obtener un token:**
```
POST /auth/login
→ data.accessToken   (expira en 15 minutos)
→ data.refreshToken  (expira en 7 días)
```

**Renovar el token:**
```
POST /auth/refresh
Body: { "refreshToken": "..." }
→ Devuelve nuevos accessToken y refreshToken
→ El token anterior queda revocado
```

**Límite de sesiones:** máximo 5 refresh tokens activos por usuario. Al superar el límite, el más antiguo se revoca automáticamente.

---

## Formato de respuesta

### Éxito

Todas las respuestas exitosas envuelven el payload en `data`:

```json
{
  "data": { ... }
}
```

Para listas:

```json
{
  "data": [ ... ]
}
```

Los endpoints `DELETE` devuelven `204 No Content` — sin body.

### Error

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Descriptive error message"
}
```

Para errores de validación con múltiples campos:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": ["field"],
      "message": "Error description"
    }
  ]
}
```

---

## Códigos HTTP

| Código | Significado  | Cuándo se usa                                            |
| ------ | ------------ | -------------------------------------------------------- |
| `200`  | OK           | GET y PATCH exitosos                                     |
| `201`  | Created      | POST que crea un recurso                                 |
| `204`  | No Content   | DELETE exitoso — sin body                                |
| `400`  | Bad Request  | Validación fallida o UUID mal formado                    |
| `401`  | Unauthorized | Token ausente, inválido o expirado                       |
| `403`  | Forbidden    | Autenticado pero sin permiso sobre el recurso            |
| `404`  | Not Found    | Recurso no existe                                        |
| `409`  | Conflict     | Recurso duplicado (nombre repetido, email ya registrado) |

---

## Convenciones generales

| Aspecto                   | Detalle                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| **IDs**                   | UUID v4 en todos los recursos                                               |
| **Fechas**                | ISO 8601 en UTC — `2026-03-10T14:14:05.862Z`                                |
| **Pesos**                 | Siempre en kilogramos, `NUMERIC(6,2)` — máx `9999.99`                       |
| **Ejercicios bodyweight** | `weight: 0` es válido                                                       |
| **Emails**                | Almacenados y devueltos en minúsculas                                       |
| **Strings**               | Trimmed automáticamente en el input                                         |
| **Soft delete**           | Ejercicios se archivan (`is_archived`), rutinas se desactivan (`is_active`) |
| **Warmup sets**           | `is_warmup: true` — se almacenan pero se excluyen de PRs, volumen y 1RM     |