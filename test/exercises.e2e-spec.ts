import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module";
import { TransformInterceptor } from "@/common/transform.interceptor";
import { PrismaService } from "@/prisma/prisma.service";
import { authHeader, registerAndLogin } from "./helpers/auth.helper";
import { cleanDatabase } from "./helpers/db.helper";

describe("Exercises E2E", () => {
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
	// POST /exercises
	// ─────────────────────────────────────────────

	describe("POST /exercises", () => {
		it("happy path: 201, devuelve el ejercicio creado", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Bench Press", category: "chest", type: "compound" });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("id");
			expect(res.body.data).toHaveProperty("name", "Bench Press");
			expect(res.body.data).toHaveProperty("category", "chest");
			expect(res.body.data).toHaveProperty("is_archived", false);
		});

		it("nombre duplicado mismo usuario → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Squat", category: "legs", type: "compound" });

			const res = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Squat", category: "legs", type: "compound" });

			expect(res.status).toBe(409);
		});

		it("nombre duplicado case-insensitive → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Deadlift", category: "back", type: "compound" });

			const res = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "DEADLIFT", category: "back", type: "compound" });

			expect(res.status).toBe(409);
		});

		it("nombre duplicado diferente usuario → 201", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user1.accessToken))
				.send({ name: "Pull Up", category: "back", type: "compound" });

			const res = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user2.accessToken))
				.send({ name: "Pull Up", category: "back", type: "compound" });

			expect(res.status).toBe(201);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer())
				.post("/exercises")
				.send({ name: "Test", category: "chest", type: "compound" });

			expect(res.status).toBe(401);
		});

		it("body vacío → 400", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({});

			expect(res.status).toBe(400);
		});

		it("category inválida → 400", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Test", category: "invalid_category", type: "compound" });

			expect(res.status).toBe(400);
		});
	});

	// ─────────────────────────────────────────────
	// GET /exercises
	// ─────────────────────────────────────────────

	describe("GET /exercises", () => {
		it("happy path: solo ejercicios no archivados del usuario", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Active Ex", category: "chest", type: "compound" });

			const res = await request(app.getHttpServer()).get("/exercises").set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(1);
			expect(res.body.data[0].name).toBe("Active Ex");
		});

		it("archivados NO aparecen por defecto", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "To Archive", category: "back", type: "compound" });

			const id = createRes.body.data.id;

			await request(app.getHttpServer())
				.patch(`/exercises/${id}/archive`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer()).get("/exercises").set(authHeader(accessToken));

			expect(res.status).toBe(200);
			const names = res.body.data.map((e: { name: string }) => e.name);
			expect(names).not.toContain("To Archive");
		});

		it("con ?includeArchived=true → aparecen archivados", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Archived Ex", category: "back", type: "compound" });

			const id = createRes.body.data.id;

			await request(app.getHttpServer())
				.patch(`/exercises/${id}/archive`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.get("/exercises?includeArchived=true")
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			const names = res.body.data.map((e: { name: string }) => e.name);
			expect(names).toContain("Archived Ex");
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer()).get("/exercises");
			expect(res.status).toBe(401);
		});

		it("no ve ejercicios de otro usuario", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user1.accessToken))
				.send({ name: "User1 Only", category: "chest", type: "compound" });

			const res = await request(app.getHttpServer())
				.get("/exercises")
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(200);
			const names = res.body.data.map((e: { name: string }) => e.name);
			expect(names).not.toContain("User1 Only");
		});
	});

	// ─────────────────────────────────────────────
	// GET /exercises/:id
	// ─────────────────────────────────────────────

	describe("GET /exercises/:id", () => {
		it("happy path: 200", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Get One", category: "arms", type: "isolation" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.get(`/exercises/${id}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.id).toBe(id);
		});

		it("ID de otro usuario → 404", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user1.accessToken))
				.send({ name: "User1 Ex", category: "chest", type: "compound" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.get(`/exercises/${id}`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});

		it("UUID inexistente → 404", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.get("/exercises/00000000-0000-0000-0000-000000000000")
				.set(authHeader(accessToken));

			expect(res.status).toBe(404);
		});

		it("UUID mal formado → 400", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.get("/exercises/not-a-uuid")
				.set(authHeader(accessToken));

			expect(res.status).toBe(400);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer()).get(
				"/exercises/00000000-0000-0000-0000-000000000000",
			);
			expect(res.status).toBe(401);
		});
	});

	// ─────────────────────────────────────────────
	// PATCH /exercises/:id
	// ─────────────────────────────────────────────

	describe("PATCH /exercises/:id", () => {
		it("happy path: 200", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Old Name", category: "chest", type: "compound" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/exercises/${id}`)
				.set(authHeader(accessToken))
				.send({ name: "New Name" });

			expect(res.status).toBe(200);
			expect(res.body.data.name).toBe("New Name");
		});

		it("nombre existente mismo usuario → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Existing", category: "back", type: "compound" });

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "To Rename", category: "back", type: "compound" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/exercises/${id}`)
				.set(authHeader(accessToken))
				.send({ name: "Existing" });

			expect(res.status).toBe(409);
		});

		it("nombre existente case-insensitive → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "ExistingCase", category: "back", type: "compound" });

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Another", category: "back", type: "compound" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/exercises/${id}`)
				.set(authHeader(accessToken))
				.send({ name: "EXISTINGCASE" });

			expect(res.status).toBe(409);
		});

		it("ID de otro usuario → 404", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user1.accessToken))
				.send({ name: "User1 Ex Patch", category: "chest", type: "compound" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/exercises/${id}`)
				.set(authHeader(user2.accessToken))
				.send({ name: "Hacked" });

			expect(res.status).toBe(404);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer())
				.patch("/exercises/00000000-0000-0000-0000-000000000000")
				.send({ name: "test" });

			expect(res.status).toBe(401);
		});
	});

	// ─────────────────────────────────────────────
	// PATCH /exercises/:id/archive  (soft delete)
	// ─────────────────────────────────────────────

	describe("PATCH /exercises/:id/archive (soft delete)", () => {
		it("happy path: ejercicio queda con is_archived = true", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Archive Target", category: "shoulders", type: "compound" });

			const id = createRes.body.data.id;

			const archiveRes = await request(app.getHttpServer())
				.patch(`/exercises/${id}/archive`)
				.set(authHeader(accessToken));

			expect(archiveRes.status).toBe(200);
			expect(archiveRes.body.data.is_archived).toBe(true);
		});

		it("no aparece en GET /exercises tras archivar", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Will Be Archived", category: "arms", type: "isolation" });

			const id = createRes.body.data.id;

			await request(app.getHttpServer())
				.patch(`/exercises/${id}/archive`)
				.set(authHeader(accessToken));

			const listRes = await request(app.getHttpServer())
				.get("/exercises")
				.set(authHeader(accessToken));

			const names = listRes.body.data.map((e: { name: string }) => e.name);
			expect(names).not.toContain("Will Be Archived");
		});

		it("ID inexistente → 404", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.patch("/exercises/00000000-0000-0000-0000-000000000000/archive")
				.set(authHeader(accessToken));

			expect(res.status).toBe(404);
		});

		it("ID de otro usuario → 404", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user1.accessToken))
				.send({ name: "User1 Archive Ex", category: "chest", type: "compound" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/exercises/${id}/archive`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer()).patch(
				"/exercises/00000000-0000-0000-0000-000000000000/archive",
			);
			expect(res.status).toBe(401);
		});
	});
});
