---
title: Users
description: Reading your own profile.
---

**Base path:** `/users`
**Authentication:** required on every endpoint

There is currently no way to update a profile — see the [MVP gaps](/architecture/business-rules/) note if you're looking for `PATCH`.

---

## Get the current user

```
GET /users/me
```

Returns the authenticated user, `password_hash` never included.

**Response `200`**

```json
{
  "data": {
    "id": "95d40fe1-…",
    "email": "you@example.com",
    "name": "Your Name",
    "is_active": true,
    "email_verified": false,
    "created_at": "2026-03-10T14:14:05.862Z",
    "updated_at": "2026-03-10T14:14:05.862Z"
  }
}
```

| Status | When                     |
| ------ | ------------------------ |
| `200`  | Success                   |
| `401`  | Missing or invalid token   |

---

## Get a user by ID

```
GET /users/:id
```

You can only fetch your own profile — `id` must match the authenticated user's ID.

| Status | When                                |
| ------ | ------------------------------------ |
| `200`  | Success                               |
| `400`  | `id` is not a valid UUID              |
| `401`  | Missing or invalid token              |
| `403`  | `id` belongs to another user          |

## Related

- [Errors](/reference/errors/)
