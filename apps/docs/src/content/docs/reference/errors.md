---
title: Errors
description: Every status code the API returns, the two error shapes it uses, and how to handle each one.
---

Every error response is JSON. There are **two different shapes** depending on what failed — a client that only parses one of them will break on the other.

All examples on this page were captured from a running instance.

## The two shapes

### Standard errors

Everything except request-body validation returns this:

```json
{
  "message": "Exercise not found",
  "error": "Not Found",
  "statusCode": 404
}
```

| Field        | Type    | Notes                                      |
| ------------ | ------- | ------------------------------------------ |
| `message`    | string  | Human-readable description                 |
| `error`      | string  | The HTTP status name                       |
| `statusCode` | integer | The HTTP status code                       |

### Validation errors

When a request body fails schema validation, the shape changes — there is **no `error` field**, and the details live in an `errors` array:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "origin": "string",
      "code": "invalid_format",
      "format": "email",
      "path": ["email"],
      "message": "Must be a valid email address"
    },
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["name"],
      "message": "Invalid input: expected string, received undefined"
    }
  ]
}
```

| Field                | Type     | Notes                                              |
| -------------------- | -------- | -------------------------------------------------- |
| `message`            | string   | Always `"Validation failed"`                       |
| `errors[].path`      | array    | Path to the offending field                        |
| `errors[].message`   | string   | Message for that field                             |
| `errors[].code`      | string   | Machine-readable failure kind                      |

:::note[Handling both]
Branch on the presence of `errors`. If it exists, the request body was invalid and you can map each entry to a form field via its `path`. Otherwise, show `message`.
:::

:::caution[Validation entries carry extra fields]
Entries in `errors` may include additional schema metadata beyond the fields documented above — including the raw validation pattern. Treat `path`, `message` and `code` as the stable contract and ignore the rest.
:::

---

## Status codes

| Code  | Meaning      | Typical cause                                                      |
| ----- | ------------ | ------------------------------------------------------------------- |
| `200` | OK           | Successful `GET` or `PATCH`, and `POST /auth/login`                 |
| `201` | Created      | A `POST` that created a resource                                    |
| `204` | No Content   | A successful `DELETE` — no body at all                              |
| `400` | Bad Request  | Body failed validation, or a path parameter is not a valid UUID     |
| `401` | Unauthorized | Missing, malformed or expired access token; bad credentials         |
| `403` | Forbidden    | Authenticated, but the resource belongs to another user             |
| `404` | Not Found    | The resource does not exist, or is not yours                        |
| `409` | Conflict     | The request contradicts current state — see below                   |

---

## Errors by situation

### 400 — Bad Request

Malformed UUID in the path:

```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

Note this uses the **standard** shape, not the validation shape — path parameters and request bodies are validated by different layers.

An empty `PATCH` body also returns `400`: every update endpoint requires at least one field.

### 401 — Unauthorized

```json
{ "message": "No token provided", "error": "Unauthorized", "statusCode": 401 }
```

```json
{ "message": "Invalid or expired token", "error": "Unauthorized", "statusCode": 401 }
```

`Invalid or expired token` is the one to handle in a client: refresh once, then retry. See [Authentication](/guides/authentication/).

Also returned for wrong login credentials, and for a refresh token that is expired, revoked, or already used.

### 403 — Forbidden

Returned when you are authenticated but the resource is not yours:

```json
{
  "message": "Cannot access another user's profile",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 — Not Found

```json
{ "message": "Exercise not found", "error": "Not Found", "statusCode": 404 }
```

Most resources return `404` rather than `403` when they belong to another user — the ownership filter runs as part of the lookup, so the resource simply is not found for you.

Unmatched routes return the same shape:

```json
{ "message": "Cannot GET /nada-aca", "error": "Not Found", "statusCode": 404 }
```

### 409 — Conflict

The state of your data contradicts the request. This is the one worth reading carefully, because the cause differs per endpoint:

| Message                                        | Cause                                                     |
| ---------------------------------------------- | --------------------------------------------------------- |
| `Email already in use`                         | Registering with an email that already exists             |
| `Cannot add sets to a finished workout`        | The workout has `finished_at` set                         |
| `Cannot modify sets of a finished workout`     | Same, on `PATCH`                                          |
| `Cannot remove sets of a finished workout`     | Same, on `DELETE`                                         |
| `Cannot log sets for an archived exercise`     | The exercise has `is_archived = true`                     |

A duplicate active exercise name also returns `409`.

---

## What is not implemented yet

:::caution
These are documented here so client authors are not surprised later.

- **No `429 Too Many Requests`.** Rate limiting does not exist yet — `/auth/login` currently accepts unlimited attempts.
- **No request correlation ID.** Error responses carry no identifier you can quote in a bug report.
- **Two shapes, not one.** Validation errors and standard errors differ, as documented above. A future global exception filter may unify them; until then, handle both.
:::

## Related

- [API Conventions](/architecture/api-conventions/) — response envelope and URL rules
- [Authentication](/guides/authentication/) — the `401` recovery flow
