---
title: Sets
description: Registra, lee, corrige y borra los sets individuales de un workout.
---

Los sets son los hechos crudos de todo el sistema. Cada métrica que reporta la API — volumen, records personales, 1RM, progresión — se deriva de estos registros y de nada más.

Todos los endpoints de sets van anidados bajo un workout: `/workouts/:workoutId/sets`.

**Base:** `/workouts/:workoutId/sets`
**Autenticación:** requerida en todos los endpoints

## El objeto set

```json
{
  "id": "550e8400-…",
  "workout_id": "0e5f2c1a-…",
  "exercise_id": "9a1b7d34-…",
  "set_number": 2,
  "weight": 100,
  "reps": 5,
  "rpe": 8.5,
  "is_warmup": false,
  "created_at": "2026-07-31T18:12:04.310Z"
}
```

| Campo         | Tipo             | Notas                                                              |
| -------------- | ------------------ | ----------------------------------------------------------------------- |
| `set_number`     | integer               | Lo asigna la API. Incrementa por ejercicio dentro de un workout             |
| `weight`         | number                | Kilogramos, `0`–`9999.99`, hasta 2 decimales. `0` es válido                     |
| `reps`           | integer               | `>= 1`                                                                            |
| `rpe`            | number \| `null`      | Rate of perceived exertion, `1`–`10` en pasos de `0.5`                           |
| `is_warmup`      | boolean               | Los calentamientos se guardan pero se excluyen de todas las métricas               |

---

## Registrar un set

```
POST /workouts/:workoutId/sets
```

**Body**

```json
{
  "exercise_id": "9a1b7d34-…",
  "weight": 100,
  "reps": 5,
  "rpe": 8.5,
  "is_warmup": false
}
```

| Campo          | Requerido | Regla                                          |
| --------------- | ----------- | -------------------------------------------------- |
| `exercise_id`     | sí            | UUID de un ejercicio activo que te pertenezca         |
| `weight`          | sí            | `0` a `9999.99`                                        |
| `reps`            | sí            | Entero `>= 1`                                            |
| `rpe`             | no            | `1` a `10`, múltiplos de `0.5`, opcional                   |
| `is_warmup`       | no            | Por defecto `false`                                          |

No envíes `set_number` — la API asigna el siguiente para ese ejercicio dentro del workout.

**Respuestas**

| Status | Cuándo                                                       |
| ------ | ---------------------------------------------------------------- |
| `201`  | Set registrado                                                      |
| `404`  | Workout no encontrado, o ejercicio no encontrado / no te pertenece     |
| `409`  | El workout está finalizado, o el ejercicio está archivado              |

---

## Listar los sets de un workout

```
GET /workouts/:workoutId/sets
```

Devuelve todos los sets del workout, calentamientos incluidos, ordenados por ejercicio y después por `set_number`.

```json
{
  "data": [
    { "id": "…", "set_number": 1, "weight": 60, "reps": 10, "is_warmup": true, "…": "…" },
    { "id": "…", "set_number": 2, "weight": 100, "reps": 5, "is_warmup": false, "…": "…" }
  ]
}
```

| Status | Cuándo              |
| ------ | ---------------------- |
| `200`  | Éxito                     |
| `404`  | Workout no encontrado      |

---

## Obtener un set

```
GET /workouts/:workoutId/sets/:id
```

| Status | Cuándo                        |
| ------ | -------------------------------- |
| `200`  | Éxito                               |
| `404`  | Workout o set no encontrado           |

---

## Corregir un set

```
PATCH /workouts/:workoutId/sets/:id
```

**Body** — todos los campos opcionales, pero al menos uno debe estar presente:

```json
{ "weight": 102.5, "reps": 4 }
```

`exercise_id` no se puede cambiar. Para mover un set a otro ejercicio, bórralo y registra uno nuevo.

| Status | Cuándo                                                   |
| ------ | ------------------------------------------------------------- |
| `200`  | Set actualizado                                                  |
| `400`  | Body vacío, o un valor fuera del rango permitido                    |
| `404`  | Workout o set no encontrado                                        |
| `409`  | El workout está finalizado                                          |

---

## Borrar un set

```
DELETE /workouts/:workoutId/sets/:id
```

Los sets se borran en duro — no tienen archivo.

| Status | Cuándo                        |
| ------ | -------------------------------- |
| `204`  | Borrado, sin body                   |
| `404`  | Workout o set no encontrado           |
| `409`  | El workout está finalizado             |

---

## Reglas a tener en cuenta

**Un workout finalizado queda congelado.** Una vez que `finished_at` está seteado, crear, actualizar y borrar sus sets devuelve `409`. Corrige tus datos antes de finalizar la sesión.

**Los ejercicios archivados rechazan sets nuevos.** No puedes registrar contra un ejercicio con `is_archived = true`. Los sets existentes que lo referencian quedan intactos — ese es el punto entero de archivar en lugar de borrar.

**Los calentamientos se guardan pero nunca se cuentan.** `is_warmup: true` mantiene al set afuera del volumen, los records personales y el 1RM. No hay forma de que la API infiera cuáles fueron calentamiento, así que este flag es la única señal.

## Relacionado

- [Trackear un workout](/es/guides/track-a-workout/) — estos endpoints en contexto
- [Analytics](/es/api/analytics/) — qué se calcula a partir de estos sets
- [Reglas de negocio](/es/architecture/business-rules/)
