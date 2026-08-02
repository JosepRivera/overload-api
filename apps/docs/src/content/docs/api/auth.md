---
title: Auth
description: Register, log in, refresh and revoke sessions.
---

**Base path:** `/auth`
**Authentication:** none of these endpoints require a token — `refresh` and `logout` require a valid `refreshToken` in the body instead.

See [Authentication](/guides/authentication/) for the full token lifecycle and how to handle expiry in a client.

---

## Register

```
POST /auth/register
```

Creates a user and logs them in immediately — no separate login call needed.

**Body**

```json
{
  "email": "you@example.com",
  "name": "Your Name",
  "password": "at-least-8-chars"
}
```

| Field      | Required | Rule                    |
| ---------- | -------- | ------------------------ |
| `email`    | yes      | Valid email, unique       |
| `name`     | yes      | 2–100 characters          |
| `password` | yes      | 8+ characters              |

**Response `201`**

```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "95d40fe1-…",
      "email": "you@example.com",
      "name": "Your Name",
      "is_active": true,
      "email_verified": false,
      "created_at": "2026-03-10T14:14:05.862Z",
      "updated_at": "2026-03-10T14:14:05.862Z"
    }
  }
}
```

| Status | When                     |
| ------ | ------------------------ |
| `201`  | User created and logged in |
| `400`  | Validation failed          |
| `409`  | Email already in use       |

---

## Login

```
POST /auth/login
```

**Body**

```json
{ "email": "you@example.com", "password": "at-least-8-chars" }
```

**Response `200`** — same shape as register.

| Status | When                 |
| ------ | -------------------- |
| `200`  | Success               |
| `401`  | Invalid credentials    |

---

## Refresh

```
POST /auth/refresh
```

Exchanges a valid refresh token for a new access/refresh pair. Rotates the pair — the token you sent is revoked the instant the new one is issued.

**Body**

```json
{ "refreshToken": "<jwt>" }
```

**Response `200`**

```json
{ "data": { "accessToken": "<jwt>", "refreshToken": "<jwt>" } }
```

| Status | When                                          |
| ------ | ---------------------------------------------- |
| `200`  | New pair issued                                 |
| `401`  | Refresh token invalid, expired, revoked, or reused |

---

## Logout

```
POST /auth/logout
```

Revokes the given refresh token immediately. The matching access token stays valid until it expires — up to 15 minutes later.

**Body**

```json
{ "refreshToken": "<jwt>" }
```

**Response `200`**

```json
{ "data": { "message": "Logged out successfully" } }
```

| Status | When                      |
| ------ | -------------------------- |
| `200`  | Token revoked                |
| `401`  | Refresh token invalid or expired |

---

## Related

- [Authentication guide](/guides/authentication/) — the full lifecycle, session limits, and the 401-handling pattern
- [Errors](/reference/errors/)
