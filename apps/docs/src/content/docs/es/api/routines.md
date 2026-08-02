---
title: Rutinas
description: Planes de entrenamiento reutilizables y los ejercicios configurados dentro de ellos.
---

Una rutina es una plantilla de workout: una lista de ejercicios con series objetivo, rangos de repeticiones, tiempos de descanso y un orden. Las rutinas son opcionales — un workout puede empezar sin una.

**Base:** `/routines`
**Autenticación:** requerida en todos los endpoints

---

## CRUD de rutinas

### Crear una rutina

```
POST /routines
```

**Body**

```json
{ "name": "Día de empuje", "description": "Pecho, hombros, tríceps" }
```

| Campo         | Requerido | Regla                                          |
| ------------- | --------- | -------------------------------------------------- |
| `name`        | sí        | 1–150 caracteres, único por usuario (solo activas)    |
| `description` | no        | hasta 2000 caracteres, opcional                        |

| Status | Cuándo                                             |
| ------ | ----------------------------------------------------- |
| `201`  | Creada                                                  |
| `400`  | Validación fallida                                       |
| `409`  | Ya tienes una rutina activa con este nombre                |

### Listar rutinas

```
GET /routines
```

Todas las rutinas activas del usuario, ordenadas por nombre.

### Obtener una rutina

```
GET /routines/:id
```

Incluye sus ejercicios, ordenados por `order_index`, cada uno con el objeto `exercise` anidado.

| Status | Cuándo                       |
| ------ | ------------------------------ |
| `200`  | Éxito                            |
| `400`  | `id` no es un UUID válido         |
| `404`  | No encontrada                     |

### Actualizar una rutina

```
PATCH /routines/:id
```

`name` y `description`, ambos opcionales.

| Status | Cuándo                                        |
| ------ | ------------------------------------------------ |
| `200`  | Actualizada                                         |
| `404`  | No encontrada                                        |
| `409`  | El nombre choca con otra rutina activa                |

### Desactivar una rutina

```
DELETE /routines/:id
```

Soft delete — marca `is_active: false`. Los workouts ya vinculados a esta rutina conservan la referencia. Una rutina desactivada no puede editarse ni recibir nuevos ejercicios.

| Status | Cuándo      |
| ------ | ----------- |
| `204`  | Desactivada  |
| `404`  | No encontrada |

---

## Ejercicios dentro de una rutina

### Agregar un ejercicio

```
POST /routines/:id/exercises
```

**Body**

```json
{
  "exercise_id": "0f68b97a-…",
  "target_sets": 4,
  "target_reps_min": 8,
  "target_reps_max": 12,
  "target_rest_sec": 120
}
```

`order_index` se asigna automáticamente, al final de la lista. `target_reps_max` debe ser `>= target_reps_min`.

| Status | Cuándo                                              |
| ------ | ------------------------------------------------------ |
| `201`  | Agregado                                                 |
| `400`  | Validación fallida                                        |
| `404`  | Rutina no encontrada, o ejercicio no encontrado/archivado  |
| `409`  | El ejercicio ya está en esta rutina                        |

### Listar los ejercicios de una rutina

```
GET /routines/:id/exercises
```

Ordenados por `order_index`, cada entrada incluye el objeto `exercise` anidado.

### Actualizar la configuración de un ejercicio

```
PATCH /routines/:id/exercises/:exerciseId
```

`target_sets`, `target_reps_min`, `target_reps_max`, `target_rest_sec`, `notes` — todos opcionales.

| Status | Cuándo                                        |
| ------ | -------------------------------------------------- |
| `200`  | Actualizado                                          |
| `404`  | Rutina no encontrada, o ejercicio no está en la rutina |

### Quitar un ejercicio de una rutina

```
DELETE /routines/:id/exercises/:exerciseId
```

Lo quita solo de esta rutina — el ejercicio en sí y su historial de sets quedan intactos.

| Status | Cuándo                                        |
| ------ | -------------------------------------------------- |
| `204`  | Quitado                                              |
| `404`  | Rutina no encontrada, o ejercicio no está en la rutina |

### Reordenar ejercicios

```
POST /routines/:id/exercises/reorder
```

**Body**

```json
{
  "exercises": [
    { "id": "0076ae59-…", "order_index": 0 },
    { "id": "ffb57e02-…", "order_index": 1 }
  ]
}
```

Envía el orden deseado **completo** en una sola llamada — los reordenamientos parciales se rechazan. Cada `id` debe pertenecer a la rutina; los valores de `order_index` deben ser únicos.

| Status | Cuándo                                                    |
| ------ | -------------------------------------------------------------- |
| `200`  | Reordenado, sin body                                             |
| `400`  | Validación fallida, o un ID no pertenece a esta rutina             |
| `404`  | Rutina no encontrada                                              |

## Relacionado

- [Trackear un workout](/es/guides/track-a-workout/)
- [Reglas de negocio — Rutinas](/es/architecture/business-rules/#rutinas)
