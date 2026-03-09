# API Conventions — Overload API

## Base URL

```
http://localhost:3000       # development
https://api.overload.com   # production
```

Interactive documentation available at `/api/docs` (Swagger UI).

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require a valid access token.

**Header format:**
```
Authorization: Bearer <access_token>
```

Access tokens expire in **15 minutes**. Use `POST /auth/refresh` with a valid refresh token to get a new one.

---

## Response Format

### Success

All successful responses wrap the payload in a `data` field.

```json
{
  "data": { ... }
}
```

For responses with no body (delete operations), only the HTTP status code is returned — no JSON body.

### Error

All error responses follow this structure:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Descriptive error message"
}
```

For validation errors with multiple fields:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "name must not be empty",
    "category must be one of: chest, back, legs, shoulders, arms, core, cardio, other"
  ]
}
```

---

## HTTP Status Codes

| Code  | Meaning      | When used                                                           |
| ----- | ------------ | ------------------------------------------------------------------- |
| `200` | OK           | Successful GET, PATCH                                               |
| `201` | Created      | Successful POST that creates a resource                             |
| `204` | No Content   | Successful DELETE — no body returned                                |
| `400` | Bad Request  | Malformed request or failed validation                              |
| `401` | Unauthorized | Missing or invalid access token                                     |
| `403` | Forbidden    | Authenticated but not allowed to access this resource               |
| `404` | Not Found    | Resource does not exist                                             |
| `409` | Conflict     | Resource already exists (e.g. duplicate exercise name, email taken) |

---

## URL Conventions

- **Plural nouns** for all resources: `/exercises`, `/workouts`, `/sets`
- **Kebab-case** for multi-word resources: `/routine-exercises`
- **No verbs in URLs** — use HTTP methods instead
- **Actions** that don't map cleanly to CRUD use a sub-resource noun:

```
POST /workouts/:id/finish     ✅
POST /finishWorkout/:id       ❌
```

### Standard CRUD pattern

```
GET    /exercises              # list all
POST   /exercises              # create one
GET    /exercises/:id          # get one
PATCH  /exercises/:id          # update one
DELETE /exercises/:id          # delete one
```

---

## Path Parameters

Always UUID v4:

```
GET /exercises/550e8400-e29b-41d4-a716-446655440000
```

---

## Query Parameters

### Pagination

```
GET /workouts?page=1&limit=20
```

- Default: `page=1`, `limit=20`
- Max limit: `100`

### Filtering

```
GET /exercises?category=chest
GET /workouts?routineId=<uuid>
```

### Sorting

```
GET /exercises?sort=name&order=asc
GET /workouts?sort=startedAt&order=desc
```

- Default sort: `createdAt desc`
- `order` values: `asc` or `desc`

---

## Date and Time

- All dates use **ISO 8601** format
- All timestamps are **UTC**
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`

```json
{
  "startedAt": "2026-03-08T10:30:00.000Z",
  "finishedAt": "2026-03-08T11:45:00.000Z"
}
```

---

## Data Conventions

- **IDs** — always UUID v4, never sequential integers
- **Emails** — stored and returned in lowercase
- **Strings** — trimmed automatically on input
- **Weights** — always in **kilograms**, decimal with up to 2 places (`NUMERIC(6,2)`)
- **Bodyweight exercises** — represented as `weight: 0.00`

---

## Global Validation Rules

| Field             | Rule                                   |
| ----------------- | -------------------------------------- |
| All string inputs | Trimmed automatically                  |
| Email             | Lowercased, validated format           |
| UUID params       | Validated as UUID v4                   |
| Weight            | `>= 0`, max `9999.99`                  |
| Reps              | `> 0`, integer                         |
| RPE               | `1.0` to `10.0`, step `0.5` (optional) |
| Set number        | `> 0`, integer                         |