---
title: Glossary
description: The strength training terms this API models, and what each one means in the data.
---

This API models a training domain with its own vocabulary. If a field name is not obvious, it is probably explained here.

## Training concepts

### Progressive overload

The principle the whole product is built on: to keep adapting, the training stimulus has to keep increasing over time — through more weight, more repetitions, or more total work.

It is also the reason metrics matter here. You cannot increase what you never measured.

### Set

One continuous group of repetitions of a single exercise, at a single weight. Three sets of eight repetitions at 100 kg is three separate records in this API, not one.

Sets are the only raw facts stored. Everything else is derived from them.

### Repetition (rep)

One complete execution of a movement. Stored as `reps` on each set.

### Warmup set

A set performed with reduced weight to prepare for the working sets. Recorded with `is_warmup: true`.

Warmups are stored but **excluded from every metric** — including them would inflate volume and produce false records. See [ADR: warmup sets excluded](/architecture/business-rules/).

### Working set

Any set that is not a warmup. These are the ones that count toward volume, personal records and 1RM.

### Compound vs. isolation

The `type` field on an exercise:

| Type         | Meaning                                                    | Example        |
| ------------ | ---------------------------------------------------------- | -------------- |
| `compound`   | Moves multiple joints and muscle groups at once            | Squat, Bench   |
| `isolation`  | Targets a single muscle across one joint                   | Bicep curl     |
| `cardio`     | Cardiovascular work                                        | Rowing         |
| `stretching` | Mobility and flexibility work                              | Hamstring hold |

### RPE — Rate of Perceived Exertion

A subjective 1–10 scale of how hard a set felt. `10` means no repetitions left in reserve; `8` means roughly two more were possible.

Stored per set as an optional field, in steps of `0.5`.

:::note
`rpe` is currently recorded but not used by any analytics endpoint. It is captured so the data exists when effort-based analysis is added.
:::

---

## Metrics

### Volume

Total mechanical work performed, calculated as:

```
volume = weight × reps
```

Summed across all working sets. The API reports it two ways:

- **Per workout** — every exercise in one session, via [`/analytics/workouts/:id/volume`](/api/analytics/)
- **Per exercise per session** — via the progression endpoint

Volume is the most honest single measure of whether a session was harder than the last one. Ten sets at a lighter weight can out-work five heavy ones.

### Personal record (PR)

Your best-ever performance on an exercise. This API tracks two, because they answer different questions:

| Record      | Definition                              | Answers                          |
| ----------- | --------------------------------------- | -------------------------------- |
| `weight_pr` | Heaviest single set, any rep count      | "How strong am I?"               |
| `volume_pr` | Highest `weight × reps` in one set      | "What is my best working set?"   |

A `100 kg × 8` set beats `120 kg × 1` on volume and loses on weight. Both are real progress.

Records are detected on read, not stored — see [Analytics](/api/analytics/).

### 1RM — One repetition maximum

The maximum weight you could lift for exactly one repetition. Actually testing it is risky and fatiguing, so it is estimated instead.

This API uses the **Epley formula**:

```
1RM = weight × (1 + reps / 30)
```

Only sets with `reps <= 10` are used — beyond that, the formula drifts too far to be useful.

The estimate is taken from the set producing the *highest* value, which is often not the heaviest set:

| Set          | Estimated 1RM |
| ------------ | ------------- |
| `90 kg × 3`  | `99.0`        |
| `80 kg × 8`  | `101.3`       |

### Progression

The session-by-session history of one exercise: total volume, average weight and average repetitions per workout, most recent first.

This is the series to plot. Rising volume at stable weight means more work at the same load; rising weight at stable volume means the load itself went up. Both are progressive overload.

---

## Data model terms

### Routine

A reusable training plan: which exercises, in what order, with target sets, repetition ranges and rest times. A routine is a template — performing it creates a workout.

Routines are optional. A workout can exist without one.

### Workout

One training session. Active while `finished_at` is `null`; closed once finished.

Only **one workout can be active per user at a time**, and a finished workout is frozen — its sets can no longer be added, edited or deleted.

### Archived exercise

An exercise marked `is_archived = true`. It disappears from the active catalog and rejects new sets, but every historical set that references it stays intact and queryable.

Exercises are never hard-deleted, because deleting one would destroy the training history built on it.

### Access token / refresh token

The two halves of a session. The access token authorizes requests for 15 minutes and is never stored server-side; the refresh token exchanges for a new pair for up to 7 days and is stored as a hash.

Full lifecycle in [Authentication](/guides/authentication/).
