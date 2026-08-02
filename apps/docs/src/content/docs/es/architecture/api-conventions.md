---
title: Convenciones de la API — Overload
---

# Convenciones de la API — Overload

## URL base

```
http://localhost:3000       # desarrollo
https://api.overload.com   # producción
```

Documentación interactiva disponible en `/api/docs` (Scalar API Reference).

---

## Autenticación

Todos los endpoints excepto `/auth/register` y `/auth/login` requieren un access token válido.

**Formato del header:**
```
Authorization: Bearer <access_token>
```

Los access tokens expiran a los **15 minutos**. Usa `POST /auth/refresh` con un refresh token válido para obtener uno nuevo.

---

## Formato de respuesta

### Éxito

Todas las respuestas exitosas envuelven el payload en un campo `data`.

```json
{
  "data": { ... }
}
```

Para respuestas sin body (operaciones delete), solo se devuelve el código de estado HTTP — sin body JSON.

### Error

Ver la [referencia de errores](/es/reference/errors/) para las dos formas de error que devuelve la API y una tabla completa de códigos de estado.

---

## Códigos de estado HTTP

| Código | Significado    | Cuándo se usa                                                       |
| ------- | ---------------- | ---------------------------------------------------------------------- |
| `200`    | OK                 | GET y PATCH exitosos                                                     |
| `201`    | Created            | POST exitoso que crea un recurso                                          |
| `204`    | No Content         | DELETE exitoso — sin body                                                  |
| `400`    | Bad Request        | Request mal formado o validación fallida                                    |
| `401`    | Unauthorized       | Access token ausente o inválido                                              |
| `403`    | Forbidden          | Autenticado pero sin permiso para acceder a este recurso                       |
| `404`    | Not Found          | El recurso no existe                                                            |
| `409`    | Conflict           | El recurso ya existe (ej. nombre de ejercicio duplicado, email ya registrado)     |

---

## Convenciones de URL

- **Sustantivos en plural** para todos los recursos: `/exercises`, `/workouts`, `/sets`
- **Kebab-case** para recursos de varias palabras: `/routine-exercises`
- **Sin verbos en las URLs** — se usan los métodos HTTP en su lugar
- Las **acciones** que no mapean limpiamente a CRUD usan un sustantivo de sub-recurso:

```
POST /workouts/:id/finish     ✅
POST /finishWorkout/:id       ❌
```

### Patrón CRUD estándar

```
GET    /exercises              # listar todos
POST   /exercises              # crear uno
GET    /exercises/:id          # obtener uno
PATCH  /exercises/:id          # actualizar uno
DELETE /exercises/:id          # borrar uno
```

---

## Parámetros de ruta

Siempre UUID v4:

```
GET /exercises/550e8400-e29b-41d4-a716-446655440000
```

---

## Query parameters

No todos los endpoints de listado soportan los mismos query parameters — revisa la página de cada módulo en la [Referencia de la API](/es/api/) para ver qué acepta realmente. Dos ejemplos de lo que existe hoy:

**Paginación** — solo en `GET /workouts`:

```
GET /workouts?page=1&limit=20
```

Por defecto `page=1`, `limit=20`; el `limit` máximo es `100`.

**Filtrado** — solo en `GET /exercises`, y solo este flag:

```
GET /exercises?includeArchived=true
```

Sin él, los ejercicios archivados se ocultan por defecto.

:::note
`exercises` no está paginado y no tiene parámetro `sort`. `routines` no tiene ni paginación ni filtrado. Todavía no hay una convención global acá — cada endpoint documenta sus propios query parameters.
:::

---

## Fecha y hora

- Todas las fechas usan formato **ISO 8601**
- Todos los timestamps son **UTC**
- Formato: `YYYY-MM-DDTHH:mm:ss.sssZ`

```json
{
  "startedAt": "2026-03-08T10:30:00.000Z",
  "finishedAt": "2026-03-08T11:45:00.000Z"
}
```

---

## Convenciones de datos

- **IDs** — siempre UUID v4, nunca enteros secuenciales
- **Emails** — se guardan y devuelven en minúsculas
- **Strings** — se recortan (trim) automáticamente en el input
- **Pesos** — siempre en **kilogramos**, decimal con hasta 2 posiciones (`NUMERIC(6,2)`)
- **Ejercicios de peso corporal** — representados como `weight: 0.00`

---

## Reglas de validación globales

| Campo               | Regla                                       |
| --------------------- | ---------------------------------------------- |
| Todos los inputs de tipo string | Se recortan (trim) automáticamente                 |
| Email                     | En minúsculas, formato validado                       |
| Parámetros UUID           | Validados como UUID v4                                 |
| Peso                      | `>= 0`, máx `9999.99`                                    |
| Reps                      | `> 0`, entero                                             |
| RPE                       | `1.0` a `10.0`, paso `0.5` (opcional)                       |
| Número de set              | `> 0`, entero                                               |
