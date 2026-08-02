---
title: Sets
description: Log, read, correct and remove the individual sets performed during a workout.
---

Sets are the raw facts of the whole system. Every metric the API reports — volume, personal records, 1RM, progression — is derived from these records and nothing else.

All set endpoints are nested under a workout: `/workouts/:workoutId/sets`.

**Base path:** `/workouts/:workoutId/sets`
**Authentication:** required on every endpoint

## The set object

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
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

| Field         | Type             | Notes                                                        |
| ------------- | ---------------- | ------------------------------------------------------------ |
| `set_number`  | integer          | Assigned by the API. Increments per exercise within a workout |
| `weight`      | number           | Kilograms, `0`–`9999.99`, up to 2 decimals. `0` is valid      |
| `reps`        | integer          | `>= 1`                                                        |
| `rpe`         | number \| `null` | Rate of perceived exertion, `1`–`10` in steps of `0.5`        |
| `is_warmup`   | boolean          | Warmups are stored but excluded from every metric             |

---

## Log a set

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

| Field         | Required | Rule                                          |
| ------------- | -------- | --------------------------------------------- |
| `exercise_id` | yes      | UUID of an active exercise you own            |
| `weight`      | yes      | `0` to `9999.99`                              |
| `reps`        | yes      | Integer `>= 1`                                |
| `rpe`         | no       | `1` to `10`, multiples of `0.5`, nullable     |
| `is_warmup`   | no       | Defaults to `false`                           |

Do **not** send `set_number` — the API assigns the next one for that exercise within the workout.

**Responses**

| Status | When                                                       |
| ------ | ---------------------------------------------------------- |
| `201`  | Set logged                                                 |
| `404`  | Workout not found, or exercise not found / not yours       |
| `409`  | The workout is finished, or the exercise is archived       |

---

## List sets in a workout

```
GET /workouts/:workoutId/sets
```

Returns every set in the workout, warmups included, ordered by exercise and then by `set_number`.

```json
{
  "data": [
    { "id": "…", "set_number": 1, "weight": 60, "reps": 10, "is_warmup": true, "…": "…" },
    { "id": "…", "set_number": 2, "weight": 100, "reps": 5, "is_warmup": false, "…": "…" }
  ]
}
```

| Status | When               |
| ------ | ------------------ |
| `200`  | Success            |
| `404`  | Workout not found  |

---

## Get one set

```
GET /workouts/:workoutId/sets/:id
```

| Status | When                       |
| ------ | -------------------------- |
| `200`  | Success                    |
| `404`  | Workout or set not found   |

---

## Correct a set

```
PATCH /workouts/:workoutId/sets/:id
```

**Body** — every field optional, but at least one must be present:

```json
{ "weight": 102.5, "reps": 4 }
```

`exercise_id` cannot be changed. To move a set to a different exercise, delete it and log a new one.

| Status | When                                              |
| ------ | ------------------------------------------------- |
| `200`  | Set updated                                       |
| `400`  | Empty body, or a value outside its allowed range  |
| `404`  | Workout or set not found                          |
| `409`  | The workout is finished                           |

---

## Delete a set

```
DELETE /workouts/:workoutId/sets/:id
```

Sets are hard-deleted — there is no archive for them.

| Status | When                     |
| ------ | ------------------------ |
| `204`  | Deleted, no body         |
| `404`  | Workout or set not found |
| `409`  | The workout is finished  |

---

## Rules worth knowing

**A finished workout is frozen.** Once `finished_at` is set, creating, updating and deleting its sets all return `409`. Correct your data before finishing the session.

**Archived exercises reject new sets.** You cannot log against an exercise with `is_archived = true`. Existing sets that reference it are untouched — that is the entire point of archiving instead of deleting.

**Warmups are stored but never counted.** `is_warmup: true` keeps the set out of volume, personal records and 1RM. There is no way for the API to infer which sets were warmups, so this flag is the only signal.

## Related

- [Track a workout](/guides/track-a-workout/) — these endpoints in context
- [Analytics](/api/analytics/) — what gets computed from these sets
- [Business Rules](/architecture/business-rules/)
