---
title: Routines
description: Reusable training plans and the exercises configured inside them.
---

A routine is a workout template: a list of exercises with target sets, rep ranges, rest times and an order. Routines are optional — a workout can start without one.

**Base path:** `/routines`
**Authentication:** required on every endpoint

---

## Routine CRUD

### Create a routine

```
POST /routines
```

**Body**

```json
{ "name": "Push Day", "description": "Chest, shoulders, triceps" }
```

| Field         | Required | Rule                                   |
| ------------- | -------- | ---------------------------------------- |
| `name`        | yes      | 1–150 chars, unique per user (active only) |
| `description` | no       | up to 2000 chars, nullable                 |

| Status | When                                            |
| ------ | ------------------------------------------------ |
| `201`  | Created                                           |
| `400`  | Validation failed                                  |
| `409`  | You already have an active routine with this name |

### List routines

```
GET /routines
```

All active routines for the user, ordered by name.

### Get a routine

```
GET /routines/:id
```

Includes its exercises, ordered by `order_index`, each with the nested `exercise` object.

| Status | When                       |
| ------ | --------------------------- |
| `200`  | Success                      |
| `400`  | `id` is not a valid UUID     |
| `404`  | Not found                    |

### Update a routine

```
PATCH /routines/:id
```

`name` and `description`, both optional.

| Status | When                                    |
| ------ | ------------------------------------------ |
| `200`  | Updated                                     |
| `404`  | Not found                                   |
| `409`  | Name collides with another active routine   |

### Deactivate a routine

```
DELETE /routines/:id
```

Soft delete — sets `is_active: false`. Workouts already linked to this routine keep the reference. A deactivated routine cannot be edited or have exercises added.

| Status | When    |
| ------ | ------- |
| `204`  | Deactivated |
| `404`  | Not found  |

---

## Exercises within a routine

### Add an exercise

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

`order_index` is assigned automatically, appended to the end. `target_reps_max` must be `>= target_reps_min`.

| Status | When                                        |
| ------ | --------------------------------------------- |
| `201`  | Added                                          |
| `400`  | Validation failed                               |
| `404`  | Routine not found, or exercise not found/archived |
| `409`  | Exercise is already in this routine             |

### List a routine's exercises

```
GET /routines/:id/exercises
```

Ordered by `order_index`, each entry includes the nested `exercise` object.

### Update an exercise's configuration

```
PATCH /routines/:id/exercises/:exerciseId
```

`target_sets`, `target_reps_min`, `target_reps_max`, `target_rest_sec`, `notes` — all optional.

| Status | When                              |
| ------ | ------------------------------------ |
| `200`  | Updated                               |
| `404`  | Routine not found, or exercise not in routine |

### Remove an exercise from a routine

```
DELETE /routines/:id/exercises/:exerciseId
```

Removes it from this routine only — the exercise itself and its logged history are untouched.

| Status | When                              |
| ------ | ------------------------------------ |
| `204`  | Removed                               |
| `404`  | Routine not found, or exercise not in routine |

### Reorder exercises

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

Send the **full** desired order in one call — partial reorders are rejected. Every `id` must belong to the routine; `order_index` values must be unique.

| Status | When                                              |
| ------ | -------------------------------------------------- |
| `200`  | Reordered, no body                                   |
| `400`  | Validation failed, or an ID doesn't belong to this routine |
| `404`  | Routine not found                                    |

## Related

- [Track a workout](/guides/track-a-workout/)
- [Business Rules — Routines](/architecture/business-rules/#routines)
