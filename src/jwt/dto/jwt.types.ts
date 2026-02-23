import { type JWTPayload } from "jose";

export type AuthUser = JWTPayload & { sub: string };
