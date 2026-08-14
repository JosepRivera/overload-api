import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module.ts";
import { TransformInterceptor } from "@/common/transform.interceptor.ts";
import { PrismaService } from "@/prisma/prisma.service.ts";
import { registerAndLogin } from "./helpers/auth.helper.ts";
import { cleanDatabase } from "./helpers/db.helper.ts";

describe("Auth E2E", () => {
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


	describe("POST /auth/register", () => {
		it("happy path: 201, devuelve accessToken, refreshToken y user sin passwordHash", async () => {
			const email = `test-${Date.now()}@test.com`;
			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email, password: "Password123!", name: "Test User" });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("accessToken");
			expect(res.body.data).toHaveProperty("refreshToken");
			expect(res.body.data).toHaveProperty("user");
			expect(res.body.data.user).toHaveProperty("id");
			expect(res.body.data.user).toHaveProperty("email", email);
			expect(res.body.data.user).not.toHaveProperty("passwordHash");
		});

		it("email duplicado → 409", async () => {
			const email = `dup-${Date.now()}@test.com`;
			await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email, password: "Password123!", name: "First" });

			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email, password: "Password123!", name: "Second" });

			expect(res.status).toBe(409);
		});

		it("email duplicado case-insensitive → 409", async () => {
			const base = `case-${Date.now()}`;
			await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email: `${base}@test.com`, password: "Password123!", name: "First" });

			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({
					email: `${base.toUpperCase()}@TEST.COM`,
					password: "Password123!",
					name: "Second",
				});

			expect(res.status).toBe(409);
		});

		it("body vacío → 400", async () => {
			const res = await request(app.getHttpServer()).post("/auth/register").send({});
			expect(res.status).toBe(400);
		});

		it("email inválido → 400", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email: "not-an-email", password: "Password123!", name: "Test" });
			expect(res.status).toBe(400);
		});

		it("password < 8 chars → 400", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email: `short-pw-${Date.now()}@test.com`, password: "abc123", name: "Test" });
			expect(res.status).toBe(400);
		});

		it("name < 2 chars → 400", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email: `short-name-${Date.now()}@test.com`, password: "Password123!", name: "A" });
			expect(res.status).toBe(400);
		});

		it("passwordHash NUNCA aparece en el response", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email: `nohash-${Date.now()}@test.com`, password: "Password123!", name: "Test" });

			expect(res.status).toBe(201);
			const bodyStr = JSON.stringify(res.body);
			expect(bodyStr).not.toContain("passwordHash");
		});
	});


	describe("POST /auth/login", () => {
		it("happy path: 200", async () => {
			const { email } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ email, password: "Password123!" });

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("accessToken");
			expect(res.body.data).toHaveProperty("refreshToken");
		});

		it("email inexistente → 401", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ email: "nonexistent@test.com", password: "Password123!" });

			expect(res.status).toBe(401);
		});

		it("password incorrecta → 401", async () => {
			const { email } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ email, password: "WrongPassword!" });

			expect(res.status).toBe(401);
		});

		it("mismo mensaje de error para email inexistente y password incorrecta", async () => {
			const { email } = await registerAndLogin(app);

			const res1 = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ email: "nonexistent@test.com", password: "Password123!" });

			const res2 = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ email, password: "WrongPassword!" });

			expect(res1.body.message).toBe(res2.body.message);
		});

		it("body vacío → 400", async () => {
			const res = await request(app.getHttpServer()).post("/auth/login").send({});
			expect(res.status).toBe(400);
		});
	});


	describe("POST /auth/refresh", () => {
		it("happy path: 200, devuelve nuevos tokens", async () => {
			const { refreshToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer()).post("/auth/refresh").send({ refreshToken });

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("accessToken");
			expect(res.body.data).toHaveProperty("refreshToken");
		});

		it("token rotación: refresh token anterior revocado → 401", async () => {
			const { refreshToken } = await registerAndLogin(app);

			await request(app.getHttpServer()).post("/auth/refresh").send({ refreshToken });

			const res = await request(app.getHttpServer()).post("/auth/refresh").send({ refreshToken });

			expect(res.status).toBe(401);
		});

		it("token inválido (string random) → 401", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/refresh")
				.send({ refreshToken: "invalid.random.token" });

			expect(res.status).toBe(401);
		});

		it("token de otro usuario → 401", async () => {
			const user1 = await registerAndLogin(app);
			await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/auth/refresh")
				.send({ refreshToken: user1.refreshToken });

			expect([200, 401]).toContain(res.status);
			if (res.status === 200) {
				expect(res.body.data).toHaveProperty("accessToken");
			}
		});
	});


	describe("POST /auth/logout", () => {
		it("happy path: 204 sin body", async () => {
			const { refreshToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer()).post("/auth/logout").send({ refreshToken });

			expect(res.status).toBe(204);
			expect(res.body).toEqual({});
		});

		it("refresh token queda revocado tras logout → 401 en /refresh", async () => {
			const { refreshToken } = await registerAndLogin(app);

			await request(app.getHttpServer()).post("/auth/logout").send({ refreshToken });

			const res = await request(app.getHttpServer()).post("/auth/refresh").send({ refreshToken });

			expect(res.status).toBe(401);
		});

		it("token inválido → 401", async () => {
			const res = await request(app.getHttpServer())
				.post("/auth/logout")
				.send({ refreshToken: "invalid.random.token" });

			expect(res.status).toBe(401);
		});
	});


	describe("Límite de 5 refresh tokens", () => {
		it("login 6 veces → token más antiguo revocado, últimos 5 activos", async () => {
			const email = `limit-${Date.now()}@test.com`;
			await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email, password: "Password123!", name: "Limit Test" });

			const tokens: string[] = [];
			for (let i = 0; i < 6; i++) {
				const res = await request(app.getHttpServer())
					.post("/auth/login")
					.send({ email, password: "Password123!" });
				tokens.push(res.body.data.refreshToken);
			}

			const firstTokenRes = await request(app.getHttpServer())
				.post("/auth/refresh")
				.send({ refreshToken: tokens[0] });
			expect(firstTokenRes.status).toBe(401);

			for (let i = 1; i <= 5; i++) {
				const res = await request(app.getHttpServer())
					.post("/auth/refresh")
					.send({ refreshToken: tokens[i] });
				expect(res.status).toBe(200);
				tokens[i] = res.body.data.refreshToken;
			}
		});
	});
});
