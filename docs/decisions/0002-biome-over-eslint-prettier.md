# 0002 — Biome over ESLint + Prettier

## Status
Accepted

## Date
2026-03-08

## Context
The traditional JavaScript toolchain uses ESLint for linting and Prettier for formatting. These are two separate tools with separate configuration files that often conflict with each other, requiring additional plugins like `eslint-config-prettier` to resolve rule collisions.

The project prioritizes a simple, fast, and zero-conflict developer experience.

## Decision
Use **Biome** as the single tool for both linting and formatting, replacing ESLint and Prettier entirely.

## Alternatives Considered
- **ESLint + Prettier** — industry standard, massive ecosystem, highly configurable, but two tools with frequent conflicts and slower performance.
- **ESLint only** — skips formatting concerns entirely, inconsistent code style across the project.
- **oxlint** — extremely fast but still maturing, limited rule coverage compared to Biome.

## Consequences
**Positive:**
- Single tool, single configuration file (`biome.json`).
- Significantly faster than ESLint + Prettier (written in Rust).
- Zero conflicts between linting and formatting rules.
- Simpler CI pipeline — one command covers both checks.

**Negative:**
- Smaller ecosystem than ESLint — some custom rules or plugins not available.
- Less community familiarity — onboarding developers may need to learn Biome.
- Some ESLint rules have no Biome equivalent yet.