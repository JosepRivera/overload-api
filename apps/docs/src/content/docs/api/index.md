---
title: API Reference
description: One page per module, with real request and response examples for every endpoint.
---

Endpoint-level documentation, grouped by module. Each page shows the request shape, the response shape, and every status code that endpoint can return.

For a live version you can call directly from the browser, use the [interactive API reference](http://localhost:3000/api/docs) — it is generated from the same OpenAPI document as this site's source of truth for request/response schemas.

## Modules

| Module                        | Covers                                              |
| ------------------------------ | ---------------------------------------------------- |
| [Auth](/api/auth/)             | Register, login, refresh and logout                  |
| [Users](/api/users/)           | Reading your own profile                              |
| [Exercises](/api/exercises/)   | Your personal exercise catalog                        |
| [Routines](/api/routines/)     | Reusable training plans                               |
| [Workouts](/api/workouts/)     | Training sessions                                      |
| [Sets](/api/sets/)             | Individual weight × reps records                      |
| [Analytics](/api/analytics/)   | Volume, personal records, 1RM and progression          |

## Before you start

- **[Authentication](/guides/authentication/)** — how to get, use, refresh and revoke tokens
- **[API Conventions](/architecture/api-conventions/)** — response envelope, pagination, URL and data rules that apply across every module
- **[Errors](/reference/errors/)** — every status code and both error shapes the API returns

If you have never made a request against this API, the [Quickstart](/guides/quickstart/) walks the whole path in about five minutes.
