import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module";
import { TransformInterceptor } from "@/common/transform.interceptor";
import { PrismaService } from "@/prisma/prisma.service";
import { authHeader, registerAndLogin } from "./helpers/auth.helper";
import { cleanDatabase } from "./helpers/db.helper";

describe("User E2E", () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		app.useGlobalPipes(new ZodValidationPipe());
		app.useGlobalInterceptors(new TransformInterceptor());
		prisma = moduleRef.get(PrismaService);
		await app.init();
	});

	beforeEach(async () => {
		await cleanDatabase(prisma);
	});

	afterAll(async () => {
		await app.close();
	});

	// ─────────────────────────────────────────────
	// GET /users/me
	// ─────────────────────────────────────────────

	describe("GET /users/me", () => {
		it("happy path: perfil sin password_hash", async () => {
			const { accessToken, user } = await registerAndLogin(app);

			const res = await request(app.getHttpServer()).get("/users/me").set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("id", user.id);
			expect(res.body.data).toHaveProperty("email");
			expect(res.body.data).toHaveProperty("name");
			expect(res.body.data).not.toHaveProperty("password_hash");

			const bodyStr = JSON.stringify(res.body);
			expect(bodyStr).not.toContain("password_hash");
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer()).get("/users/me");
			expect(res.status).toBe(401);
		});
	});
});
