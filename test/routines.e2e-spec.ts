import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module.ts";
import { TransformInterceptor } from "@/common/transform.interceptor.ts";
import { PrismaService } from "@/prisma/prisma.service.ts";
import { authHeader, registerAndLogin } from "./helpers/auth.helper.ts";
import { cleanDatabase } from "./helpers/db.helper.ts";

describe("Routines E2E", () => {
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


	describe("POST /routines", () => {
		it("happy path: 201", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Push Day", description: "Chest, shoulders, triceps" });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("id");
			expect(res.body.data).toHaveProperty("name", "Push Day");
			expect(res.body.data).toHaveProperty("isActive", true);
		});

		it("nombre duplicado mismo usuario → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Pull Day" });

			const res = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Pull Day" });

			expect(res.status).toBe(409);
		});

		it("nombre duplicado case-insensitive → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Leg Day" });

			const res = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "LEG DAY" });

			expect(res.status).toBe(409);
		});

		it("nombre duplicado diferente usuario → 201", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(user1.accessToken))
				.send({ name: "Full Body" });

			const res = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(user2.accessToken))
				.send({ name: "Full Body" });

			expect(res.status).toBe(201);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer())
				.post("/routines")
				.send({ name: "Test Routine" });

			expect(res.status).toBe(401);
		});

		it("body vacío → 400", async () => {
			const { accessToken } = await registerAndLogin(app);

			const res = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({});

			expect(res.status).toBe(400);
		});
	});


	describe("GET /routines", () => {
		it("rutinas inactivas NO aparecen en el listado", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "To Deactivate" });

			const id = createRes.body.data.id;

			await request(app.getHttpServer()).delete(`/routines/${id}`).set(authHeader(accessToken));

			const res = await request(app.getHttpServer()).get("/routines").set(authHeader(accessToken));

			expect(res.status).toBe(200);
			const names = res.body.data.map((r: { name: string }) => r.name);
			expect(names).not.toContain("To Deactivate");
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer()).get("/routines");
			expect(res.status).toBe(401);
		});
	});


	describe("GET /routines/:id", () => {
		it("happy path: incluye routineExercises ordenados por orderIndex", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Test Routine With Exercises" });

			const routineId = routineRes.body.data.id;

			const ex1 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex A", category: "chest", type: "compound" });

			const ex2 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex B", category: "back", type: "compound" });

			await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex1.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex2.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const res = await request(app.getHttpServer())
				.get(`/routines/${routineId}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("routineExercises");
			expect(Array.isArray(res.body.data.routineExercises)).toBe(true);
			expect(res.body.data.routineExercises.length).toBe(2);

			const indices = res.body.data.routineExercises.map(
				(re: { orderIndex: number }) => re.orderIndex,
			);
			expect(indices[0]).toBeLessThanOrEqual(indices[1]);
		});

		it("rutina de otro usuario → 404", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(user1.accessToken))
				.send({ name: "User1 Routine" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.get(`/routines/${id}`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});
	});


	describe("PATCH /routines/:id", () => {
		it("happy path: 200", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Old Routine Name" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/routines/${id}`)
				.set(authHeader(accessToken))
				.send({ name: "New Routine Name" });

			expect(res.status).toBe(200);
			expect(res.body.data.name).toBe("New Routine Name");
		});

		it("rutina inactiva → 404", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Inactive Routine" });

			const id = createRes.body.data.id;

			await request(app.getHttpServer()).delete(`/routines/${id}`).set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.patch(`/routines/${id}`)
				.set(authHeader(accessToken))
				.send({ name: "Try Updating Inactive" });

			expect(res.status).toBe(404);
		});

		it("conflicto de nombre → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Routine A" });

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Routine B" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/routines/${id}`)
				.set(authHeader(accessToken))
				.send({ name: "Routine A" });

			expect(res.status).toBe(409);
		});
	});


	describe("DELETE /routines/:id", () => {
		it("happy path: 204 sin body", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "To Delete" });

			const id = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.delete(`/routines/${id}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(204);
			expect(res.body).toEqual({});
		});

		it("rutina ya inactiva → 404", async () => {
			const { accessToken } = await registerAndLogin(app);

			const createRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Delete Twice" });

			const id = createRes.body.data.id;

			await request(app.getHttpServer()).delete(`/routines/${id}`).set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.delete(`/routines/${id}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(404);
		});
	});


	describe("POST /routines/:id/exercises", () => {
		it("happy path: 201", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Routine With Ex" });

			const routineId = routineRes.body.data.id;

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Bench Press Add", category: "chest", type: "compound" });

			const exerciseId = exRes.body.data.id;

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: exerciseId,
					targetSets: 4,
					targetRepsMin: 6,
					targetRepsMax: 10,
					targetRestSec: 120,
				});

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("exerciseId", exerciseId);
			expect(res.body.data).not.toHaveProperty("routineId");
		});

		it("ejercicio archivado → error", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Routine Archived Ex" });

			const routineId = routineRes.body.data.id;

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Archived Exercise", category: "chest", type: "compound" });

			const exerciseId = exRes.body.data.id;

			await request(app.getHttpServer())
				.patch(`/exercises/${exerciseId}/archive`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: exerciseId,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			expect(res.status).toBe(404);
		});

		it("ejercicio de otro usuario → 404", async () => {
			const user1 = await registerAndLogin(app);
			const user2 = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(user1.accessToken))
				.send({ name: "User1 Routine Ex" });

			const routineId = routineRes.body.data.id;

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user2.accessToken))
				.send({ name: "User2 Exercise", category: "chest", type: "compound" });

			const exerciseId = exRes.body.data.id;

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(user1.accessToken))
				.send({
					exerciseId: exerciseId,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			expect(res.status).toBe(404);
		});

		it("ejercicio ya en la rutina → 409", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Dup Routine Ex" });

			const routineId = routineRes.body.data.id;

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Dup Exercise", category: "chest", type: "compound" });

			const exerciseId = exRes.body.data.id;

			await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: exerciseId,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: exerciseId,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			expect(res.status).toBe(409);
		});

		it("rutina inactiva → 404", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Inactive Routine Add Ex" });

			const routineId = routineRes.body.data.id;

			await request(app.getHttpServer())
				.delete(`/routines/${routineId}`)
				.set(authHeader(accessToken));

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex For Inactive", category: "chest", type: "compound" });

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: exRes.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			expect(res.status).toBe(404);
		});

		it("targetRepsMax < targetRepsMin → 400", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Reps Validation Routine" });

			const routineId = routineRes.body.data.id;

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Reps Validation Ex", category: "chest", type: "compound" });

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: exRes.body.data.id,
					targetSets: 3,
					targetRepsMin: 12,
					targetRepsMax: 8,
					targetRestSec: 90,
				});

			expect(res.status).toBe(400);
		});
	});


	describe("POST /routines/:id/exercises/reorder", () => {
		it("happy path: reordena correctamente", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Reorder Routine" });

			const routineId = routineRes.body.data.id;

			const ex1 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex Reorder 1", category: "chest", type: "compound" });

			const ex2 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex Reorder 2", category: "back", type: "compound" });

			const re1 = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex1.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const re2 = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex2.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const re1Id = re1.body.data.id;
			const re2Id = re2.body.data.id;

			const reorderRes = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises/reorder`)
				.set(authHeader(accessToken))
				.send({
					exercises: [
						{ id: re1Id, orderIndex: 1 },
						{ id: re2Id, orderIndex: 0 },
					],
				});

			expect(reorderRes.status).toBe(200);

			const getRes = await request(app.getHttpServer())
				.get(`/routines/${routineId}`)
				.set(authHeader(accessToken));

			const reordered = getRes.body.data.routineExercises;
			const firstItem = reordered.find((re: { id: string }) => re.id === re2Id);
			const secondItem = reordered.find((re: { id: string }) => re.id === re1Id);
			expect(firstItem.orderIndex).toBe(0);
			expect(secondItem.orderIndex).toBe(1);
		});

		it("IDs parciales (no todos los ejercicios de la rutina) → error", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Partial Reorder Routine" });

			const routineId = routineRes.body.data.id;

			const ex1 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex Partial 1", category: "chest", type: "compound" });

			await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex1.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises/reorder`)
				.set(authHeader(accessToken))
				.send({
					exercises: [{ id: "00000000-0000-0000-0000-000000000000", orderIndex: 0 }],
				});

			expect(res.status).toBe(400);
		});

		it("orderIndex duplicados en el payload → error", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Dup Index Routine" });

			const routineId = routineRes.body.data.id;

			const ex1 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex Dup Index 1", category: "chest", type: "compound" });

			const ex2 = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: "Ex Dup Index 2", category: "back", type: "compound" });

			const re1 = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex1.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const re2 = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exerciseId: ex2.body.data.id,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
				});

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises/reorder`)
				.set(authHeader(accessToken))
				.send({
					exercises: [
						{ id: re1.body.data.id, orderIndex: 0 },
						{ id: re2.body.data.id, orderIndex: 0 },
					],
				});

			expect(res.status).toBe(400);
		});
	});
});
