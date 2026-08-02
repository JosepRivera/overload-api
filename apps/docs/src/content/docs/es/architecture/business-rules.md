---
title: Reglas de Negocio — Overload
description: "- Overview"
---

# Reglas de Negocio — Overload

## Índice

- [Overview](#overview)
- [Ciclo de vida del usuario](#ciclo-de-vida-del-usuario)
- [Flujo de autenticación](#flujo-de-autenticación)
- [Ejercicios](#ejercicios)
- [Rutinas](#rutinas)
- [Workouts](#workouts)
- [Sets](#sets)
- [Analytics y Métricas](#analytics-y-métricas)
- [Reglas transversales](#reglas-transversales)

---

## Overview

Overload es un tracker de entrenamiento de fuerza construido alrededor del **progressive overload**: la práctica de aumentar gradualmente el estímulo de entrenamiento (peso, reps, volumen) para producir una adaptación muscular medible a lo largo del tiempo.

El loop central es:

```
El usuario crea ejercicios
       ↓
El usuario arma rutinas (opcional — los workouts pueden ser libres)
       ↓
El usuario inicia una sesión de workout (opcionalmente vinculada a una rutina)
       ↓
El usuario registra sets (ejercicio + peso + reps) durante la sesión
       ↓
El usuario finaliza el workout
       ↓
El sistema calcula volumen, PRs y 1RM on-demand a partir de los sets registrados
```

---

## Ciclo de vida del usuario

### Registro
- Un usuario se registra con **email + nombre + contraseña**.
- El email se almacena y se trata como **case-insensitive** (en minúsculas internamente).
- Las contraseñas se hashean con **bcrypt** antes de guardarse — nunca en texto plano.
- Al registrarse con éxito, la API devuelve de inmediato un access token + refresh token, así el usuario queda logueado directamente.

### Login
- El usuario se autentica con email + contraseña.
- Si tiene éxito, recibe un **access token** (TTL 15 min) y un **refresh token** (TTL 7 días).

### Gestión de sesión
- El access token es **stateless** — nunca se guarda en la base de datos. Se valida criptográficamente en cada request.
- El refresh token **sí** se guarda, como hash SHA-256 — nunca en texto plano.
- Un usuario puede tener **hasta 5 refresh tokens activos** simultáneamente (o sea, 5 dispositivos/sesiones logueadas). Al superar el límite, el **token activo más antiguo se revoca automáticamente**.

> **¿Por qué 5, y por qué auto-revocar en lugar de bloquear?** Sin límite, una cuenta comprometida puede acumular decenas de sesiones sin control. Un límite de 1 (sesión única) es la opción más segura, pero fuerza el logout en todos lados con cada login nuevo — mala UX para cualquiera con más de un dispositivo. La gestión explícita de dispositivos (nombrar y revocar cada uno individualmente, al estilo PAT de GitHub) es más flexible pero no justifica la complejidad extra en esta etapa. 5 cubre la cantidad realista de dispositivos de una persona sin dejar de acotar la exposición. El costo: un sexto login cierra la sesión más antigua en silencio, sin que la API muestre por qué — las apps cliente deberían contemplarlo.

- En cada refresh de token, el refresh token anterior se revoca y se emite uno nuevo (rotación de tokens).
- En logout, el refresh token se revoca de inmediato (`revoked_at = NOW()`).

> **¿Por qué access tokens stateless + refresh tokens persistidos?** La alternativa — sesiones completas del lado del servidor — implica una consulta a la base de datos en cada request autenticado. Un JWT totalmente stateless (sin refresh token) sería aún más rápido, pero un access token robado queda válido hasta que expira, sin forma de revocarlo. Este diseño combina lo mejor de ambos: los access tokens se verifican criptográficamente sin costo de DB, mientras que los refresh tokens — la única credencial de larga duración — pueden revocarse al instante ante un logout o un compromiso de seguridad. El trade-off es que un access token robado sigue siendo válido hasta 15 minutos; esa ventana es el costo deliberado de evitar una consulta a la DB en cada request.

### Estados de cuenta
| Estado               | Comportamiento                                          |
| --------------------- | ---------------------------------------------------------- |
| `is_active = TRUE`     | Normal — puede autenticarse y usar la API                    |
| `is_active = FALSE`    | Bloqueado — no puede loguearse (bloqueo suave, datos intactos) |

---

## Flujo de autenticación

```
POST /auth/register   → crea el usuario + emite access + refresh token
POST /auth/login      → verifica credenciales + emite access + refresh token
POST /auth/refresh    → valida el refresh token → rota los tokens (el viejo se revoca, se emite uno nuevo)
POST /auth/logout     → revoca el refresh token provisto
```

**Reglas:**
- `password_hash` **nunca** se devuelve en ninguna respuesta.
- Si un refresh token está expirado, revocado o no existe — el request se rechaza con 401.
- Si un usuario tiene 5 tokens activos y se loguea de nuevo, el más antiguo se revoca en silencio.

---

## Ejercicios

Los ejercicios son el **catálogo personal** de movimientos contra los que un usuario puede registrar sets. Cada usuario gestiona su propio catálogo de forma independiente.

### Crear ejercicios
- Cada ejercicio tiene un `name`, una `category` (ej. pecho, espalda, piernas) y un `type` (compound, isolation, cardio, stretching).
- Los nombres de ejercicio son **únicos por usuario, case-insensitive**, entre los no archivados.
  - Un usuario no puede tener dos ejercicios activos llamados "Press de Banca" y "press de banca".
  - Un usuario *sí puede* tener un "Press de Banca" archivado y uno nuevo activo con el mismo nombre (la restricción de unicidad solo aplica a los activos).

### Archivar (soft delete)
- Los ejercicios **nunca se borran en duro** si tienen sets asociados en el historial.
- En cambio, se marcan `is_archived = TRUE` — se ocultan del catálogo activo pero se conservan.
- El usuario puede **restaurar** un ejercicio archivado en cualquier momento.
- Al listar ejercicios, los archivados se excluyen por defecto. El cliente puede optar por incluirlos.

> **¿Por qué soft delete en lugar de hard delete?** Un hard delete con `ON DELETE CASCADE` destruiría cada set jamás registrado contra ese ejercicio — inaceptable cuando el historial es el valor central de la app. Poner la referencia del ejercicio en `NULL` en sus sets evita el cascade pero deja los datos históricos imposibles de consultar por ejercicio. Mover los ejercicios borrados a una tabla de archivo separada preserva todo pero agrega complejidad de joins sin un beneficio real. Archivar en el lugar mantiene el historial intacto y consultable con un solo flag, al costo de que cada consulta al catálogo necesite un `WHERE is_archived = FALSE` explícito.

### Estados del ejercicio
| Estado                 | Visible en el catálogo | Se pueden registrar sets | Se puede restaurar |
| ----------------------- | ------------------------ | --------------------------- | --------------------- |
| `is_archived = FALSE`    | ✅ Sí                       | ✅ Sí                          | —                        |
| `is_archived = TRUE`     | ❌ No (por defecto)         | ❌ No                          | ✅ Sí                     |

---

## Rutinas

Las rutinas son **plantillas de workout** — una lista predefinida de ejercicios con series objetivo, rangos de reps y tiempos de descanso. Son opcionales; un usuario puede iniciar un workout sin ninguna.

### Crear rutinas
- Los nombres de rutina son **únicos por usuario, case-insensitive**, entre las activas.
- Una rutina puede tener una `description` (opcional).

### Agregar ejercicios a una rutina
- Solo se pueden agregar **ejercicios activos (no archivados)** que pertenezcan al mismo usuario.
- Un ejercicio solo puede aparecer **una vez** en una rutina dada.
- Cada entrada de ejercicio guarda: `target_sets`, `target_reps_min`, `target_reps_max`, `target_rest_sec`, `order_index`, y `notes` opcionales.
- `target_reps_max` debe ser **≥ target_reps_min**.
- El `order_index` determina el orden de visualización (0-indexado). Se puede reordenar.

### Reordenar
- El cliente envía el orden completo deseado como un array de `{ id, order_index }`.
- Todos los IDs deben pertenecer a la rutina. No se permiten reordenamientos parciales.
- Los valores de `order_index` deben ser únicos dentro de la rutina.

### Desactivar (soft delete)
- Las rutinas **nunca se borran en duro**. Se marcan `is_active = FALSE`.
- Los workouts que estaban vinculados a una rutina desactivada conservan su referencia a `routine_id` (registro histórico).
- Una rutina desactivada no puede actualizarse ni recibir nuevos ejercicios.

### Estados de la rutina
| Estado               | Visible | Se puede usar para iniciar un workout | Se puede editar |
| ---------------------- | ------- | ---------------------------------------- | ------------------ |
| `is_active = TRUE`      | ✅ Sí     | ✅ Sí                                        | ✅ Sí                |
| `is_active = FALSE`     | ❌ No     | ❌ No                                        | ❌ No                |

---

## Workouts

Un workout representa una **sesión de entrenamiento real** realizada por el usuario.

### Iniciar un workout
- Un usuario puede tener **como máximo 1 workout activo** a la vez (impuesto tanto a nivel de servicio como de base de datos, vía un índice único parcial sobre `user_id WHERE finished_at IS NULL`).
- Iniciar un workout nuevo mientras uno ya está activo devuelve un error de conflicto — el usuario debe finalizar o borrar el actual primero.

> **¿Por qué no permitir workouts concurrentes, o finalizar el anterior automáticamente?** Permitir varias sesiones activas a la vez hace ambiguo a qué workout pertenece cada set — un problema real entre varios dispositivos. También se consideró finalizar en silencio el workout anterior al iniciar uno nuevo, pero eso muta datos sin una acción explícita del usuario, y podría marcar como completada una sesión genuinamente inconclusa. Exigir que el usuario cierre la anterior primero mantiene "el workout activo" como un concepto inequívoco en todos lados — la API, el cliente y el analytics. El costo: si la app se cierra de golpe, un workout queda abierto indefinidamente hasta que el usuario lo finalice o borre a mano.

- `routine_id` es opcional — el usuario puede iniciar un "workout libre" sin plantilla.
- `started_at` es requerido (timestamp provisto por el cliente, ej. cuando el usuario tocó "Iniciar").

### Finalizar un workout
- `POST /workouts/:id/finish` — el servidor setea `finished_at = NOW()`.
- Un workout es **inmutable una vez que tiene sets** — solo `notes` puede actualizarse después de registrar sets.
- Un workout sin sets puede borrarse.

### Estados del workout
| `finished_at` | Estado                  | Puede agregar sets | Puede borrarse   | Puede actualizarse |
| -------------- | ------------------------ | --------------------- | ------------------- | ---------------------- |
| `NULL`          | 🟡 Activo / En progreso    | ✅ Sí                    | ✅ (si no tiene sets)  | ✅ solo notes             |
| No nulo         | ✅ Completado               | ❌ No                    | ❌ No                  | ✅ solo notes             |

### Restricciones
- `finished_at` debe ser `>= started_at` si está presente.
- Duración máxima del workout: **6 horas**.
- Si una sesión queda abandonada (crash de la app, etc.), sigue abierta indefinidamente hasta que el usuario la cierra o borra a mano.

---

## Sets

Los sets son la **unidad atómica de datos de entrenamiento** — un ejercicio realizado con un peso y reps determinados, dentro de un workout.

### Registrar un set
- Un set pertenece a un workout y referencia un ejercicio.
- Campos requeridos: `exercise_id`, `set_number`, `weight`, `reps`.
- Opcionales: `rpe` (Rate of Perceived Exertion, 1.0–10.0 en pasos de 0.5), `is_warmup`.
- `weight = 0.00` es válido para ejercicios de peso corporal.
- `set_number` es único por `(workout_id, exercise_id)` — dos sets no pueden compartir el mismo número para el mismo ejercicio en el mismo workout.

### Sets de calentamiento
- Un set marcado `is_warmup = TRUE` se **registra pero se excluye** de todos los cálculos estadísticos: volumen, PRs y 1RM.
- Esto refleja la práctica real de entrenamiento: los sets de calentamiento usan pesos más livianos y no son representativos del rendimiento real.
- El usuario debe marcar correctamente sus sets de calentamiento — la calidad del dato depende de la disciplina del usuario.

> **¿Por qué registrarlos igual, en lugar de no guardar los calentamientos?** No registrarlos es más simple, pero pierde la posibilidad de revisar o analizar el historial completo de una sesión en algún momento. Incluirlos en las estadísticas se descartó de plano — infla el volumen y produce PRs falsos con pesos livianos, dejando los números activamente engañosos. Registrarlos y excluirlos es la única opción que mantiene tanto el historial completo de la sesión como métricas honestas. El costo recae enteramente en el usuario: no hay nada que lo imponga más allá del flag, así que sets mal etiquetados contaminan los datos sin que la API tenga forma de detectarlo.

### Inmutabilidad de los sets
- Los sets solo pueden agregarse a **workouts activos (en progreso)**.
- Una vez que un workout está finalizado, sus sets no pueden modificarse.
- Los sets de un workout finalizado son inmutables — no se pueden actualizar ni borrar.

---

## Analytics y Métricas

Todas las métricas se **calculan on-demand** en el momento de la consulta. Nada se pre-calcula ni se guarda en la base de datos — los cálculos siempre reflejan el estado actual de los datos.

> **¿Por qué no guardarlas?** Las vistas materializadas se actualizan automáticamente pero agregan complejidad al schema y la duda de cuándo refrescarlas. Las columnas desnormalizadas (un `total_volume` en `workouts`, actualizado en cada cambio de set) son rápidas de leer pero corren el riesgo de desincronizarse silenciosamente de la realidad si la lógica de actualización tiene algún bug — y por definición no lo notarías hasta que los números ya se vieran mal. El recálculo por eventos necesita infraestructura de colas que la escala de este proyecto no justifica. Calcular al leer significa que el schema solo guarda hechos crudos, un bug en la fórmula se arregla desplegando el fix — no con un backfill — y los números siempre son demostrablemente correctos. El costo es el tiempo de consulta para usuarios con historiales muy grandes; ver las notas de particionado en [Esquema de Base de Datos](/es/architecture/database-schema/) si eso se vuelve real.

### Volumen
- **Por set:** `weight × reps`
- **Por workout:** `SUM(weight × reps)` sobre todos los sets no-calentamiento

### Records personales (PRs)
Se trackean dos tipos de PR por ejercicio:
- **PR de peso:** `MAX(weight)` sobre todos los sets no-calentamiento de ese ejercicio
- **PR de volumen:** `MAX(weight × reps)` sobre todos los sets no-calentamiento de ese ejercicio

Los PRs son por usuario — cada usuario tiene sus propios records.

### Estimación de 1RM (fórmula de Epley)
```
1RM = weight × (1 + reps / 30.0)
```
- Solo aplica a sets con `reps <= 10`. Con más reps la fórmula produce estimaciones de 1RM poco confiables.
- Solo aplica a sets no-calentamiento.
- Es una **estimación**, no un máximo probado.

### Progresión histórica
Agregada por ejercicio a lo largo del tiempo (cronológicamente):
- Peso promedio por sesión
- Reps promedio por sesión
- Volumen total por sesión

### Resumen de condiciones por métrica
| Métrica          | Fórmula                       | Condición                          |
| ------------------ | -------------------------------- | ------------------------------------- |
| Volumen del set     | `weight × reps`                    | `is_warmup = FALSE`                     |
| Volumen del workout  | `SUM(weight × reps)`                | `is_warmup = FALSE`                     |
| PR de peso          | `MAX(weight)`                        | `is_warmup = FALSE`                     |
| PR de volumen        | `MAX(weight × reps)`                  | `is_warmup = FALSE`                     |
| Estimación de 1RM     | `weight × (1 + reps / 30.0)`           | `reps <= 10`, `is_warmup = FALSE`          |

---

## Reglas transversales

### Propiedad de los datos
- Todos los recursos (ejercicios, rutinas, workouts, sets) son **por usuario**.
- Un usuario solo puede leer, crear o modificar sus propios datos.
- Acceder a recursos de otro usuario devuelve 403 Forbidden.

### Soft delete vs. hard delete
| Recurso        | Estrategia de borrado             | Motivo                                            |
| --------------- | ------------------------------------ | ----------------------------------------------------- |
| Usuario           | Soft (`is_active = FALSE`)             | Preserva todo el historial de entrenamiento              |
| Ejercicio          | Soft (`is_archived = TRUE`)             | Preserva el historial de sets vinculado                    |
| Rutina             | Soft (`is_active = FALSE`)               | Preserva el historial de workouts vinculado                  |
| Workout            | Hard (solo si no tiene sets)              | No hay historial que preservar                                |
| Set                | Hard                                        | Los sets son el dato crudo; el borrado es intencional            |
| Refresh token       | Revocación lógica (`revoked_at`)             | Registro de auditoría por seguridad                             |

### Unicidad de nombres
| Recurso            | Alcance    | Case sensitive         | Entre                                  |
| -------------------- | ----------- | ------------------------- | ------------------------------------------ |
| Nombre de ejercicio     | Por usuario   | ❌ No (índice LOWER)          | Solo activos (`is_archived = FALSE`)           |
| Nombre de rutina         | Por usuario   | ❌ No (índice LOWER)          | Solo activas (`is_active = TRUE`)              |
| Email de usuario         | Global        | ❌ No (índice LOWER)          | Todos los usuarios                              |

### Forma de la respuesta
- Todas las respuestas exitosas: `{ data: ... }`
- Operaciones DELETE: `204 No Content` — sin body
- Errores: `{ statusCode, error, message }`
- `password_hash` **nunca** se incluye en ninguna respuesta
