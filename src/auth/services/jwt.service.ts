import { Injectable } from "@nestjs/common";
import { errors, type JWTPayload, jwtVerify, SignJWT } from "jose";
import { env } from "@/config/env";
import type { VerifyResult } from "../dto/verify-result.dto";

@Injectable()
export class JwtService {
	private readonly secretKey: Uint8Array;
	private readonly algorithm = "HS256" as const;

	constructor() {
		this.secretKey = new TextEncoder().encode(env.JWT_SECRET);
	}

	private async sign(payload: JWTPayload, expiresIn: string): Promise<string> {
		return new SignJWT(payload)
			.setProtectedHeader({ alg: this.algorithm })
			.setIssuedAt()
			.setExpirationTime(expiresIn)
			.sign(this.secretKey);
	}

	async signAccessToken(payload: JWTPayload): Promise<string> {
		return this.sign(payload, env.JWT_ACCESS_TOKEN_TTL);
	}

	async signRefreshToken(payload: JWTPayload): Promise<string> {
		return this.sign(payload, env.JWT_REFRESH_TOKEN_TTL);
	}

	async verify(token: string): Promise<VerifyResult> {
		try {
			const { payload } = await jwtVerify(token, this.secretKey, {
				algorithms: [this.algorithm],
			});

			return {
				valid: true,
				expired: false,
				decoded: payload,
			};
		} catch (error) {
			if (error instanceof errors.JWTExpired) {
				return {
					valid: false,
					expired: true,
					decoded: null,
					errorType: "expired",
				};
			}

			if (error instanceof errors.JWTInvalid) {
				return {
					valid: false,
					expired: false,
					decoded: null,
					errorType: "invalid",
				};
			}

			return {
				valid: false,
				expired: false,
				decoded: null,
				errorType: "unknown",
			};
		}
	}
}
