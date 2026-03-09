# 0005 — JWT Stateless Access Tokens with Persisted Refresh Tokens

## Status
Accepted

## Date
2026-03-08

## Context
The API needs a secure authentication mechanism that balances performance, security, and the ability to revoke sessions. Two main approaches were considered: server-side sessions stored in the database, or stateless JWT tokens.

## Decision
Use **stateless JWT access tokens** (not stored in DB) combined with **refresh tokens stored as SHA-256 hashes** in the `refresh_tokens` table.

## Alternatives Considered
- **Full server-side sessions** — every request requires a DB lookup to validate the session. Simple to revoke but adds latency and DB load on every authenticated request.
- **Stateless JWT only (no refresh tokens)** — simple but tokens cannot be revoked before expiry. A stolen token is valid until it expires.
- **Opaque tokens (both access and refresh stored in DB)** — maximum revocation control but every request hits the database.

## Consequences
**Positive:**
- Access token validation requires no DB query — pure cryptographic verification via `jose`.
- Refresh tokens can be revoked immediately (logout, compromise detection).
- Refresh tokens are stored as SHA-256 hashes — plain text tokens are never persisted.
- Device management: max 5 active refresh tokens per user.
- Token rotation on every refresh — old token is revoked, new one is issued.

**Negative:**
- Access tokens cannot be individually revoked before expiry (15 minutes). If an access token is stolen, it remains valid until it expires.
- Slightly more complex implementation than a simple session cookie approach.

## Security Policies
- Access token TTL: `15m`
- Refresh token TTL: `7d`
- On logout: `revoked_at = NOW()`
- On compromise: revoke all tokens for the user
- Automatic cleanup of expired tokens via cron job