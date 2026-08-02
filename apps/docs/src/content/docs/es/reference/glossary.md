---
title: Glosario
description: Los términos de entrenamiento de fuerza que modela esta API, y qué significa cada uno en los datos.
---

Esta API modela un dominio de entrenamiento con vocabulario propio. Si el nombre de un campo no es obvio, probablemente esté explicado acá.

## Conceptos de entrenamiento

### Progressive overload

El principio sobre el que está construido todo el producto: para seguir adaptándose, el estímulo de entrenamiento tiene que seguir aumentando con el tiempo — con más peso, más repeticiones, o más trabajo total.

También es la razón por la que las métricas importan acá. No puedes aumentar lo que nunca mediste.

### Set

Un grupo continuo de repeticiones de un mismo ejercicio, a un mismo peso. Tres series de ocho repeticiones a 100 kg son tres registros separados en esta API, no uno.

Los sets son el único hecho crudo que se guarda. Todo lo demás se deriva de ellos.

### Repetición (rep)

Una ejecución completa de un movimiento. Se guarda como `reps` en cada set.

### Set de calentamiento (warmup)

Un set realizado con peso reducido para preparar los sets de trabajo. Se registra con `is_warmup: true`.

Los calentamientos se guardan pero se **excluyen de todas las métricas** — incluirlos inflaría el volumen y produciría records falsos. Ver [ADR: sets de calentamiento excluidos](/es/architecture/business-rules/).

### Set de trabajo

Cualquier set que no sea calentamiento. Estos son los que cuentan para el volumen, los records personales y el 1RM.

### Compound vs. isolation

El campo `type` de un ejercicio:

| Tipo            | Significado                                                       | Ejemplo           |
| ----------------- | ---------------------------------------------------------------------- | -------------------- |
| `compound`             | Mueve varias articulaciones y grupos musculares a la vez                  | Sentadilla, Press de Banca |
| `isolation`            | Aísla un solo músculo a través de una sola articulación                        | Curl de bíceps         |
| `cardio`               | Trabajo cardiovascular                                                          | Remo                     |
| `stretching`           | Trabajo de movilidad y flexibilidad                                                | Elongación de isquios      |

### RPE — Rate of Perceived Exertion

Una escala subjetiva de 1 a 10 de qué tan duro se sintió un set. `10` significa que no quedaban repeticiones en reserva; `8` significa que probablemente quedaban unas dos más.

Se guarda por set como campo opcional, en pasos de `0.5`.

:::note
`rpe` hoy se registra pero ningún endpoint de analytics lo usa todavía. Se captura para que el dato exista cuando se agregue análisis basado en esfuerzo.
:::

---

## Métricas

### Volumen

Trabajo mecánico total realizado, calculado como:

```
volumen = weight × reps
```

Sumado sobre todos los sets de trabajo. La API lo reporta de dos formas:

- **Por workout** — todos los ejercicios de una sesión, vía [`/analytics/workouts/:id/volume`](/es/api/analytics/)
- **Por ejercicio y por sesión** — vía el endpoint de progresión

El volumen es la medida individual más honesta de si una sesión fue más dura que la anterior. Diez sets con un peso más liviano pueden superar a cinco pesados.

### Record personal (PR)

Tu mejor performance histórica en un ejercicio. Esta API trackea dos, porque responden preguntas distintas:

| Record         | Definición                                     | Responde                              |
| ---------------- | ----------------------------------------------- | ---------------------------------------- |
| `weight_pr`          | El set individual más pesado, sin importar las reps  | "¿Qué tan fuerte soy?"                       |
| `volume_pr`           | El mayor `weight × reps` en un solo set                | "¿Cuál es mi mejor set de trabajo?"             |

Un set de `100 kg × 8` le gana a `120 kg × 1` en volumen y pierde en peso. Ambos son progreso real.

Los records se detectan al leer, no se guardan — ver [Analytics](/es/api/analytics/).

### 1RM — Una repetición máxima

El peso máximo que podrías levantar en exactamente una repetición. Probarlo de verdad es riesgoso y agotador, así que se estima en su lugar.

Esta API usa la **fórmula de Epley**:

```
1RM = weight × (1 + reps / 30)
```

Solo se usan sets con `reps <= 10` — pasado eso, la fórmula se desvía demasiado como para ser útil.

La estimación se toma del set que produce el valor *más alto*, que muchas veces no es el set más pesado:

| Set             | 1RM estimado |
| ------------------ | --------------- |
| `90 kg × 3`            | `99.0`             |
| `80 kg × 8`            | `101.3`             |

### Progresión

El historial sesión por sesión de un ejercicio: volumen total, peso promedio y repeticiones promedio por workout, la más reciente primero.

Esta es la serie para graficar. Un volumen que sube con peso estable significa más trabajo con la misma carga; un peso que sube con volumen estable significa que la carga en sí subió. Ambos son progressive overload.

---

## Términos del modelo de datos

### Rutina

Un plan de entrenamiento reutilizable: qué ejercicios, en qué orden, con series objetivo, rangos de repeticiones y tiempos de descanso. Una rutina es una plantilla — realizarla crea un workout.

Las rutinas son opcionales. Un workout puede existir sin una.

### Workout

Una sesión de entrenamiento. Está activo mientras `finished_at` sea `null`; cerrado una vez finalizado.

Solo **un workout puede estar activo por usuario a la vez**, y un workout finalizado queda congelado — sus sets ya no se pueden agregar, editar ni borrar.

### Ejercicio archivado

Un ejercicio marcado `is_archived = true`. Desaparece del catálogo activo y rechaza sets nuevos, pero cada set histórico que lo referencia queda intacto y consultable.

Los ejercicios nunca se borran en duro, porque borrar uno destruiría el historial de entrenamiento construido sobre él.

### Access token / refresh token

Las dos mitades de una sesión. El access token autoriza requests durante 15 minutos y nunca se guarda del lado del servidor; el refresh token se intercambia por un par nuevo hasta por 7 días y se guarda como hash.

Ciclo de vida completo en [Autenticación](/es/guides/authentication/).
