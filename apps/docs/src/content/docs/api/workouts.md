---
title: Workouts
description: Training sessions — start, list, update, finish and delete.
---

A workout is a real training session. Only one can be active per user at a time.

**Base path:** `/workouts`
**Authentication:** required on every endpoint

## The workout object

```json
{
  "id": "a1b2c3d4-…",
  "user_id": "95d40fe1-…",
  "routine_id": "a1b2c3d4-…",
  "started_at": "2026-03-15T22:00:00.000Z",
  "finished_at": null,
  "notes": "Morning session, high energy.",
  "created_at": "2026-03-15T22:00:00.000Z"
}
```

`finished_at: null` means the workout is active.

---

## Start a workout

```
POST /workouts
```

**Body**

```json
{
  "routine_id": "a1b2c3d4-…",
  "started_at": "2026-03-15T22:00:00.000Z",
  "notes": "Morning session, high energy."
}
```

| Field        | Required | Rule                                       |
| ------------ | -------- | -------------------------------------------- |
| `routine_id` | no       | UUID of an active routine you own              |
| `started_at` | yes      | ISO 8601, cannot be in the future              |
| `notes`      | no       | up to 2000 chars, nullable                     |

| Status | When                              |
| ------ | ------------------------------------ |
| `201`  | Started                               |
| `400`  | Validation failed, or `started_at` in the future |
| `409`  | You already have an active workout    |

---

## List workouts

```
GET /workouts?page=1&limit=20
```

**Finished** workouts only, paginated, most recent first.

**Response `200`**

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

`page` defaults to `1`, `limit` to `20` (max `100`).

---

## Get the active workout

```
GET /workouts/active
```

Returns the active workout, or `{ "data": null }` if none exists. Never `404`.

---

## Get a workout

```
GET /workouts/:id
```

| Status | When                       |
| ------ | --------------------------- |
| `200`  | Success                      |
| `400`  | `id` is not a valid UUID     |
| `404`  | Not found                    |

---

## Update notes

```
PATCH /workouts/:id
```

Only `notes` can be changed, and on **any** workout — active or finished.

---

## Finish a workout

```
POST /workouts/:id/finish
```

Sets `finished_at` to now. From this point the workout is frozen: its sets can no longer be added, edited or deleted.

| Status | When                                            |
| ------ | -------------------------------------------------- |
| `200`  | Finished                                            |
| `400`  | Already finished, or session exceeds 6 hours        |
| `404`  | Not found                                           |

:::caution[6-hour cap]
A workout cannot be finished if `finished_at - started_at` exceeds 6 hours. If a session runs long, correct `started_at` first — there is no override.
:::

---

## Delete a workout

```
DELETE /workouts/:id
```

Only allowed if the workout has **no sets**. To discard a workout with sets logged, delete the sets first.

| Status | When                                   |
| ------ | ----------------------------------------- |
| `204`  | Deleted                                    |
| `404`  | Not found                                  |
| `409`  | Workout has sets and cannot be deleted     |

## Related

- [Track a workout](/guides/track-a-workout/)
- [Sets](/api/sets/)
- [Business Rules — Workouts](/architecture/business-rules/#workouts)
