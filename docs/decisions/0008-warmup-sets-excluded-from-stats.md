# 0008 — Warmup Sets Excluded from Stats and PRs

## Status
Accepted

## Date
2026-03-08

## Context
In strength training, athletes typically perform warmup sets before their working sets — using significantly lower weights to prepare joints and muscles. These warmup sets are not representative of the athlete's actual performance and should not influence personal records or training volume calculations.

## Decision
Sets marked with `is_warmup = TRUE` are **recorded in the database but excluded** from all statistical calculations: total volume, personal records (weight PR and volume PR), and 1RM estimation.

## Alternatives Considered
- **Not recording warmup sets at all** — simpler schema but loses the ability to review full session history or analyze warmup patterns in the future.
- **Recording warmup sets and including them in stats** — inflates volume numbers and produces false PRs with light weights, making the data misleading.
- **Separate table for warmup sets** — overcomplicates the schema for a simple boolean distinction.

## Consequences
**Positive:**
- Volume, PR, and 1RM stats reflect only real working performance — data is meaningful and accurate.
- Warmup history is preserved for future analysis if needed.
- Simple boolean flag — no schema complexity added.

**Negative:**
- Every stats query must include `WHERE is_warmup = FALSE` — this is enforced at the query layer and must not be forgotten.
- Users must correctly mark their warmup sets, otherwise data quality depends on user discipline.
- The specialized PR index in the `sets` table explicitly filters `is_warmup = FALSE` for performance.