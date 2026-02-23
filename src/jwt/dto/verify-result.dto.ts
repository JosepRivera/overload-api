import type { JWTPayload } from "jose";

export interface VerifyResult {
	valid: boolean;
	expired: boolean;
	decoded: JWTPayload | null;
	errorType?: "expired" | "invalid" | "unknown";
}
