# 0001 — Zod over class-validator

## Status
Accepted

## Date
2026-03-08

## Context
NestJS uses `class-validator` and `class-transformer` by default for DTO validation. This approach relies on TypeScript decorators (still experimental) and requires classes — it cannot work with plain objects or Zod-inferred types.

The project prioritizes strict TypeScript typing and a schema-first validation approach that integrates naturally with the rest of the codebase.

## Decision
Use **Zod** for all input validation instead of `class-validator`.

## Alternatives Considered
- **class-validator + class-transformer** — native NestJS integration, large ecosystem, but decorator-based and requires classes for every DTO.
- **Joi** — mature library but no native TypeScript inference, types must be declared separately.
- **Yup** — similar to Zod but weaker TypeScript support and smaller community.

## Consequences
**Positive:**
- Full TypeScript type inference from schemas — no duplicate type declarations.
- Works with plain objects, no class instantiation required.
- Single source of truth: the Zod schema is both the validator and the type.
- No dependency on experimental decorator metadata.

**Negative:**
- NestJS built-in `ValidationPipe` cannot be used directly — requires a custom Zod validation pipe.
- Less out-of-the-box integration with Swagger decorators (requires manual schema mapping or `@anatine/zod-nestjs`).