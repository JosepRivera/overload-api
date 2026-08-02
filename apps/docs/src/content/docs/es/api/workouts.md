---
title: Workouts
description: Sesiones de entrenamiento — iniciar, listar, actualizar, finalizar y borrar.
---

Un workout es una sesión de entrenamiento real. Solo puede haber uno activo por usuario a la vez.

**Base:** `/workouts`
**Autenticación:** requerida en todos los endpoints

## El objeto workout

```json
{
  "id": "a1b2c3d4-…",
  "user_id": "95d40fe1-…",
  "routine_id": "a1b2c3d4-…",
  "started_at": "2026-03-15T22:00:00.000Z",
  "finished_at": null,
  "notes": "Sesión matutina, energía alta.",
  "created_at": "2026-03-15T22:00:00.000Z"
}
```

`finished_at: null` significa que el workout está activo.

---

## Iniciar un workout

```
POST /workouts
```

**Body**

```json
{
  "routine_id": "a1b2c3d4-…",
  "started_at": "2026-03-15T22:00:00.000Z",
  "notes": "Sesión matutina, energía alta."
}
```

| Campo        | Requerido | Regla                                       |
| ------------ | --------- | ----------------------------------------------- |
| `routine_id` | no        | UUID de una rutina activa que te pertenezca        |
| `started_at` | sí        | ISO 8601, no puede estar en el futuro               |
| `notes`      | no        | hasta 2000 caracteres, opcional                       |

| Status | Cuándo                                    |
| ------ | -------------------------------------------- |
| `201`  | Iniciado                                        |
| `400`  | Validación fallida, o `started_at` en el futuro   |
| `409`  | Ya tienes un workout activo                       |

---

## Listar workouts

```
GET /workouts?page=1&limit=20
```

Solo workouts **finalizados**, paginados, del más reciente al más antiguo.

**Respuesta `200`**

```json
{
  "data": {
    "workouts": [ { "id": "…", "…": "…" } ],
    "total": 4,
    "page": 1,
    "limit": 20
  }
}
```

`page` por defecto es `1`, `limit` es `20` (máx `100`).

---

## Obtener el workout activo

```
GET /workouts/active
```

Devuelve el workout activo, o `{ "data": null }` si no hay ninguno. Nunca `404`.

---

## Obtener un workout

```
GET /workouts/:id
```

| Status | Cuándo                       |
| ------ | ------------------------------ |
| `200`  | Éxito                            |
| `400`  | `id` no es un UUID válido         |
| `404`  | No encontrado                     |

---

## Actualizar notas

```
PATCH /workouts/:id
```

Solo se puede cambiar `notes`, y en **cualquier** workout — activo o finalizado.

---

## Finalizar un workout

```
POST /workouts/:id/finish
```

Marca `finished_at` con el momento actual. Desde ahí el workout queda congelado: sus sets ya no se pueden agregar, editar ni borrar.

| Status | Cuándo                                            |
| ------ | ---------------------------------------------------- |
| `200`  | Finalizado                                             |
| `400`  | Ya está finalizado, o la sesión supera las 6 horas       |
| `404`  | No encontrado                                            |

:::caution[Límite de 6 horas]
Un workout no puede finalizarse si `finished_at - started_at` supera las 6 horas. Si una sesión se extendió, corrige `started_at` primero — no hay forma de forzarlo.
:::

---

## Borrar un workout

```
DELETE /workouts/:id
```

Solo permitido si el workout **no tiene sets**. Para descartar un workout con sets registrados, borra los sets primero.

| Status | Cuándo                                    |
| ------ | -------------------------------------------- |
| `204`  | Borrado                                        |
| `404`  | No encontrado                                   |
| `409`  | El workout tiene sets y no se puede borrar        |

## Relacionado

- [Trackear un workout](/es/guides/track-a-workout/)
- [Sets](/es/api/sets/)
- [Reglas de negocio — Workouts](/es/architecture/business-rules/#workouts)
