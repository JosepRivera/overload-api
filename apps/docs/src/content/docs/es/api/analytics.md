---
title: Analytics
description: Volumen, records personales, estimación de 1RM y progresión — calculados a partir de tus sets en cada request.
---

Analytics es lo que separa a esta API de un cuaderno de entrenamiento. Cada valor acá se deriva de los sets que registraste, calculado en el momento en que lo pides.

**Base:** `/analytics`
**Autenticación:** requerida en todos los endpoints

:::note[Nada acá se guarda]
Ninguna métrica se persiste. Pregunta dos veces y se calcula dos veces. Eso significa que corregir un set mal cargado corrige de inmediato cada número derivado de él — no hay caché que invalidar ni total desactualizado que reconciliar.
:::

:::caution[Los sets de calentamiento se excluyen en todos lados]
Cada endpoint de esta página ignora los sets marcados `is_warmup: true`. Un calentamiento que no se marcó va a inflar tu volumen y puede producir un record personal falso.
:::

---

## Records personales

```
GET /analytics/exercises/:exerciseId/prs
```

Devuelve dos records para el ejercicio, ambos calculados sobre sets no-calentamiento:

```json
{
  "data": {
    "weight_pr": 120,
    "volume_pr": 800
  }
}
```

| Campo         | Significado                                                             |
| --------------- | ---------------------------------------------------------------------------- |
| `weight_pr`        | El set individual más pesado, sin importar las reps                            |
| `volume_pr`         | El mayor `weight × reps` producido por un solo set                              |

Ambos son `null` cuando el ejercicio todavía no tiene sets elegibles.

Los dos responden preguntas distintas. `weight_pr` es tu techo de fuerza. `volume_pr` es tu mejor set de trabajo individual — `100 kg × 8` le gana a `120 kg × 1` en volumen aunque pierda en peso.

| Status | Cuándo                            |
| ------ | ------------------------------------ |
| `200`  | Éxito                                    |
| `404`  | Ejercicio no encontrado o no te pertenece |

---

## 1RM estimado

```
GET /analytics/exercises/:exerciseId/1rm
```

Estima el peso máximo que podrías levantar en una sola repetición, usando la **fórmula de Epley**:

```
1RM = weight × (1 + reps / 30)
```

```json
{
  "data": {
    "exercise_id": "9a1b7d34-…",
    "estimated_1rm": 112.5,
    "based_on": { "weight": 100, "reps": 3 }
  }
}
```

| Campo             | Significado                                              |
| ------------------- | -------------------------------------------------------------- |
| `estimated_1rm`        | La estimación, redondeada a un decimal. `null` si no hay ninguna |
| `based_on`             | El set que la produjo. `null` si no hay ninguno                     |

**Solo se consideran sets con `reps <= 10`.** Pasadas las diez repeticiones la fórmula de Epley se desvía mucho, así que incluir esos sets empeoraría la estimación, no la mejoraría.

La API elige el set que produce la **estimación más alta**, no el set más pesado — muchas veces son distintos:

| Set             | Estimación |
| ------------------ | ------------ |
| `90 kg × 3`            | `99.0`          |
| `80 kg × 8`            | `101.3`          |

El segundo set es más liviano pero mejor predictor, así que gana.

Si ningún set califica, `estimated_1rm` y `based_on` son ambos `null` y el status sigue siendo `200`.

| Status | Cuándo                            |
| ------ | ------------------------------------ |
| `200`  | Éxito                                    |
| `404`  | Ejercicio no encontrado o no te pertenece |

---

## Progresión

```
GET /analytics/exercises/:exerciseId/progression?limit=20
```

Devuelve una entrada por cada sesión de workout en la que se entrenó el ejercicio, la más reciente primero.

**Query parameters**

| Parámetro | Tipo    | Default | Rango     |
| ----------- | --------- | --------- | ------------ |
| `limit`       | integer     | `20`        | `1`–`100`      |

```json
{
  "data": [
    {
      "workout_id": "0e5f2c1a-…",
      "date": "2026-07-31T18:00:00.000Z",
      "total_volume": 1500,
      "avg_weight": 100,
      "avg_reps": 5
    }
  ]
}
```

| Campo            | Significado                                                     |
| ------------------ | ---------------------------------------------------------------------- |
| `total_volume`        | Suma de `weight × reps` para ese ejercicio en esa sesión                  |
| `avg_weight`           | Peso promedio en los sets de trabajo de esa sesión                          |
| `avg_reps`             | Repeticiones promedio en los sets de trabajo de esa sesión                     |
| `date`                 | El `started_at` de la sesión                                                    |

Este es el endpoint para graficar. Un `total_volume` que sube con `avg_weight` estable significa más trabajo con la misma carga; un `avg_weight` que sube con volumen estable significa que la carga en sí subió. Ambos son progressive overload — solo se ven distinto en un gráfico.

| Status | Cuándo                            |
| ------ | ------------------------------------ |
| `200`  | Éxito                                    |
| `404`  | Ejercicio no encontrado o no te pertenece |

---

## Volumen del workout

```
GET /analytics/workouts/:workoutId/volume
```

Trabajo total realizado en una sesión, sumando todos los ejercicios:

```json
{
  "data": {
    "workout_id": "0e5f2c1a-…",
    "total_volume": 4820
  }
}
```

`total_volume` es la suma de `weight × reps` sobre todos los sets no-calentamiento del workout. Un workout sin sets de trabajo devuelve `0`, no `null`.

| Status | Cuándo                          |
| ------ | ----------------------------------- |
| `200`  | Éxito                                  |
| `404`  | Workout no encontrado o no te pertenece |

---

## Relacionado

- [Trackear un workout](/es/guides/track-a-workout/) — cómo se producen los datos que leen estos endpoints
- [Sets](/es/api/sets/) — los registros crudos a partir de los cuales se calcula todo
- [Glosario](/es/reference/glossary/) — volumen, PR, 1RM y RPE explicados
