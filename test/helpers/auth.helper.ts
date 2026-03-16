import type { INestApplication } from "@nestjs/common";
import request from "supertest";

export async function registerAndLogin(
	app: INestApplication,
	overrides: Record<string, string> = {},
) {
	const email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
	const res = await request(app.getHttpServer())
		.post("/auth/register")
		.send({ email, password: "Password123!", name: "Test User", ...overrides });

	return {
		accessToken: res.body.data.accessToken as string,
		refreshToken: res.body.data.refreshToken as string,
		user: res.body.data.user,
		email,
	};
}

export function authHeader(token: string): { Authorization: string } {
	return { Authorization: `Bearer ${token}` };
}
