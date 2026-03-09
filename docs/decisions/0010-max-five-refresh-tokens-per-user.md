# 0010 — Maximum Five Active Refresh Tokens per User

## Status
Accepted

## Date
2026-03-08

## Context
Each time a user logs in from a device, a refresh token is issued and stored in the database. Without a limit, a user could accumulate an unbounded number of active tokens over time — one per login, per device, per browser. This has security and storage implications.

## Decision
A maximum of **5 active refresh tokens per user** are allowed simultaneously. When the limit is reached, the oldest active token is automatically revoked before issuing a new one.

## Alternatives Considered
- **No limit** — simplest implementation but tokens accumulate indefinitely. A compromised account could have dozens of active sessions with no practical way to audit them.
- **1 token per user (single session)** — maximum security but forces logout on all other devices when logging in from a new one. Poor UX for multi-device users.
- **Explicit device management** — let users name and revoke devices manually (like GitHub Personal Access Tokens). Better UX but significantly more implementation complexity not justified at this stage.
- **Limit by IP or device fingerprint** — brittle and easily bypassed, not reliable enough for a security constraint.

## Consequences
**Positive:**
- Reasonable multi-device support — most users have fewer than 5 devices.
- Bounds the number of active sessions per user, limiting exposure in case of account compromise.
- Simple to implement — count active tokens before issuing a new one, revoke oldest if limit exceeded.

**Negative:**
- Power users with more than 5 devices will be silently logged out of their oldest session.
- The "oldest token revoked" behavior should be communicated to the user in the client application.
- Device limit is hardcoded — making it configurable per user would require additional schema changes.