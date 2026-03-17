import { beforeEach, describe, expect, it } from "vitest";
import { JwtService } from "@/jwt/jwt.service";

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("JwtService", () => {
	let service: JwtService;

	beforeEach(() => {
		service = new JwtService();
	});

	// -------------------------------------------------------------------------
	// signAccessToken / signRefreshToken
	// -------------------------------------------------------------------------

	describe("signAccessToken", () => {
		it("returns a JWT string", async () => {
			const token = await service.signAccessToken({ sub: "user-1", email: "a@b.com" });

			expect(typeof token).toBe("string");
			expect(token.split(".")).toHaveLength(3); // header.payload.signature
		});

		it("produces a token that verifies successfully", async () => {
			const token = await service.signAccessToken({ sub: "user-1", email: "a@b.com" });
			const result = await service.verify(token);

			expect(result.valid).toBe(true);
			expect(result.decoded?.sub).toBe("user-1");
		});
	});

	describe("signRefreshToken", () => {
		it("returns a JWT string", async () => {
			const token = await service.signRefreshToken({ sub: "user-1", jti: "uuid-123" });

			expect(typeof token).toBe("string");
			expect(token.split(".")).toHaveLength(3);
		});

		it("produces a token that verifies successfully", async () => {
			const token = await service.signRefreshToken({ sub: "user-1", jti: "uuid-123" });
			const result = await service.verify(token);

			expect(result.valid).toBe(true);
			expect(result.decoded?.sub).toBe("user-1");
		});

		it("includes the jti claim in the payload", async () => {
			const token = await service.signRefreshToken({ sub: "user-1", jti: "unique-id-abc" });
			const result = await service.verify(token);

			expect(result.decoded?.jti).toBe("unique-id-abc");
		});
	});

	// -------------------------------------------------------------------------
	// verify — happy path
	// -------------------------------------------------------------------------

	describe("verify", () => {
		it("returns valid=true and the decoded payload for a fresh token", async () => {
			const payload = { sub: "user-42", email: "test@test.com" };
			const token = await service.signAccessToken(payload);

			const result = await service.verify(token);

			expect(result.valid).toBe(true);
			expect(result.expired).toBe(false);
			expect(result.decoded?.sub).toBe("user-42");
			expect(result.decoded?.email).toBe("test@test.com");
			expect(result.errorType).toBeUndefined();
		});

		// -------------------------------------------------------------------------
		// verify — expired token
		// -------------------------------------------------------------------------

		it("returns expired=true for an already-expired token", async () => {
			// Craft a token manually with exp already in the past — no fake timers needed
			const { SignJWT } = await import("jose");
			const secret = new TextEncoder().encode(process.env.JWT_SECRET);

			const token = await new SignJWT({ sub: "user-1" })
				.setProtectedHeader({ alg: "HS256" })
				.setIssuedAt(Math.floor(Date.now() / 1000) - 120) // issued 2 min ago
				.setExpirationTime(Math.floor(Date.now() / 1000) - 60) // expired 1 min ago
				.sign(secret);

			const result = await service.verify(token);

			expect(result.valid).toBe(false);
			expect(result.expired).toBe(true);
			expect(result.decoded).toBeNull();
			expect(result.errorType).toBe("expired");
		});

		// -------------------------------------------------------------------------
		// verify — invalid token
		// -------------------------------------------------------------------------

		it("returns valid=false and errorType=invalid for a token with bad signature", async () => {
			// Valid JWT structure (3 parts) but signature does not match
			const result = await service.verify(
				"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.invalidsignatureXXXXXXXXXXXXXXXXXXXXXXXX",
			);

			expect(result.valid).toBe(false);
			expect(result.expired).toBe(false);
			expect(result.decoded).toBeNull();
			expect(result.errorType).toBe("invalid");
		});

		it("returns valid=false and errorType=invalid for a token signed with a different secret", async () => {
			const { SignJWT } = await import("jose");
			const wrongSecret = new TextEncoder().encode("wrong-secret-totally-different-32chars!!");

			const token = await new SignJWT({ sub: "attacker" })
				.setProtectedHeader({ alg: "HS256" })
				.setIssuedAt()
				.setExpirationTime("15m")
				.sign(wrongSecret);

			const result = await service.verify(token);

			expect(result.valid).toBe(false);
			expect(result.decoded).toBeNull();
			expect(result.errorType).toBe("invalid");
		});

		it("returns valid=false and errorType=invalid for a token with tampered payload", async () => {
			const token = await service.signAccessToken({ sub: "user-1" });

			const [header, , signature] = token.split(".");
			const tamperedPayload = Buffer.from(JSON.stringify({ sub: "attacker" })).toString(
				"base64url",
			);
			const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

			const result = await service.verify(tamperedToken);

			expect(result.valid).toBe(false);
			expect(result.decoded).toBeNull();
			expect(result.errorType).toBe("invalid");
		});

		// -------------------------------------------------------------------------
		// verify — unknown / garbage input
		// -------------------------------------------------------------------------

		it("returns valid=false and errorType=invalid for a completely malformed string", async () => {
			const result = await service.verify("not.a.valid.jwt.at.all");

			expect(result.valid).toBe(false);
			expect(result.expired).toBe(false);
			expect(result.decoded).toBeNull();
			expect(result.errorType).toBe("invalid");
		});

		it("returns valid=false and errorType=invalid for an empty string", async () => {
			const result = await service.verify("");

			expect(result.valid).toBe(false);
			expect(result.decoded).toBeNull();
			expect(result.errorType).toBe("invalid");
		});
	});
});
