---
title: Exercises
description: Your personal catalog of movements — created, listed, updated and archived.
---

Exercises are the personal catalog a user logs sets against. Each user manages their own catalog independently.

**Base path:** `/exercises`
**Authentication:** required on every endpoint

## The exercise object

```json
{
  "id": "f1013006-…",
  "user_id": "95d40fe1-…",
  "name": "Bench Press",
  "category": "chest",
  "type": "compound",
  "notes": null,
  "is_archived": false,
  "created_at": "2026-03-10T14:42:44.468Z",
  "updated_at": "2026-03-10T14:42:44.468Z"
}
```

`category` — one of `chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`, `other`.
`type` — one of `compound`, `isolation`, `cardio`, `stretching`.

---

## Create an exercise

```
POST /exercises
```

**Body**

```json
{ "name": "Bench Press", "category": "chest", "type": "compound", "notes": "Main chest lift" }
```

| Field      | Required | Rule                       |
| ---------- | -------- | ---------------------------- |
| `name`     | yes      | 1–150 chars, unique per user (active only) |
| `category` | yes      | one of the 8 categories above |
| `type`     | yes      | one of the 4 types above       |
| `notes`    | no       | up to 2000 chars, nullable     |

| Status | When                                              |
| ------ | -------------------------------------------------- |
| `201`  | Created                                             |
| `400`  | Validation failed                                    |
| `409`  | You already have an active exercise with this name  |

---

## List exercises

```
GET /exercises?includeArchived=false
```

Ordered by name. Archived exercises are excluded unless `includeArchived=true`.

| Status | When    |
| ------ | ------- |
| `200`  | Success  |

---

## Get an exercise

```
GET /exercises/:id
```

Returns the exercise regardless of archive status.

| Status | When                       |
| ------ | --------------------------- |
| `200`  | Success                      |
| `400`  | `id` is not a valid UUID     |
| `404`  | Not found                    |

---

## Update an exercise

```
PATCH /exercises/:id
```

Every field optional — `name`, `category`, `type`, `notes`.

| Status | When                                              |
| ------ | -------------------------------------------------- |
| `200`  | Updated                                             |
| `400`  | `id` malformed, or validation failed                 |
| `404`  | Not found                                            |
| `409`  | Name collides with another active exercise           |

---

## Archive an exercise

```
PATCH /exercises/:id/archive
```

Soft delete. Sets `is_archived: true`; the exercise disappears from the default catalog listing but every set logged against it stays intact. New sets can no longer be logged against it.

| Status | When                       |
| ------ | --------------------------- |
| `200`  | Archived                     |
| `400`  | `id` is not a valid UUID     |
| `404`  | Not found                    |

## Related

- [Track a workout](/guides/track-a-workout/)
- [Business Rules — Exercises](/architecture/business-rules/#exercises)
