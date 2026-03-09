# 0011 — jose over @nestjs/jwt

## Status
Accepted

## Date
2026-03-08

## Context
NestJS provides an official JWT module (`@nestjs/jwt`) that wraps the `jsonwebtoken` library. It integrates directly with NestJS's dependency injection and guards system. However, `jsonwebtoken` is a legacy library that predates the Web Crypto API standard and does not support modern JWT implementations natively.

## Decision
Use **`jose`** for all JWT operations (signing, verification, and key management) instead of `@nestjs/jwt`.

## Alternatives Considered
- **@nestjs/jwt (jsonwebtoken)** — official NestJS module, automatic integration with `AuthGuard` and `PassportStrategy`. However, `jsonwebtoken` uses Node.js `crypto` internals rather than the Web Crypto API, is not edge-runtime compatible, and the library itself is in maintenance mode.
- **jsonwebtoken directly** — same underlying library as `@nestjs/jwt` without the NestJS wrapper. No benefit over using the official module.
- **fast-jwt** — performance-focused alternative, but smaller community and less alignment with Web Crypto standards.

## Consequences
**Positive:**
- `jose` is fully compliant with the **Web Crypto API** standard (WHATWG).
- Compatible with edge runtimes (Cloudflare Workers, Deno, Bun) — future-proof if the runtime changes.
- Actively maintained with a focus on standards compliance.
- Supports all modern JWA, JWS, JWE, JWK, and JWT operations.

**Negative:**
- Cannot use NestJS's built-in `AuthGuard('jwt')` or `PassportStrategy` — the JWT guard must be implemented manually.
- Slightly more boilerplate: a custom `JwtModule` and `JwtGuard` are required instead of using the out-of-the-box NestJS solution.
- Less documentation and community examples specific to NestJS + jose combination.