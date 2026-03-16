import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module";
import { TransformInterceptor } from "@/common/transform.interceptor";
import { PrismaService } from "@/prisma/prisma.service";
import { authHeader, registerAndLogin } from "./helpers/auth.helper";
import { cleanDatabase } from "./helpers/db.helper";

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

	// ─────────────────────────────────────────────
	// POST /routines
	// ─────────────────────────────────────────────

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
			expect(res.body.data).toHaveProperty("is_active", true);
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

	// ─────────────────────────────────────────────
	// GET /routines
	// ─────────────────────────────────────────────

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

	// ─────────────────────────────────────────────
	// GET /routines/:id
	// ─────────────────────────────────────────────

	describe("GET /routines/:id", () => {
		it("happy path: incluye routine_exercises ordenados por order_index", async () => {
			const { accessToken } = await registerAndLogin(app);

			const routineRes = await request(app.getHttpServer())
				.post("/routines")
				.set(authHeader(accessToken))
				.send({ name: "Test Routine With Exercises" });

			const routineId = routineRes.body.data.id;

			// Create two exercises and add them to the routine
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
					exercise_id: ex1.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exercise_id: ex2.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			const res = await request(app.getHttpServer())
				.get(`/routines/${routineId}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("routine_exercises");
			expect(Array.isArray(res.body.data.routine_exercises)).toBe(true);
			expect(res.body.data.routine_exercises.length).toBe(2);

			// Verify order_index ordering
			const indices = res.body.data.routine_exercises.map(
				(re: { order_index: number }) => re.order_index,
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

	// ─────────────────────────────────────────────
	// PATCH /routines/:id
	// ─────────────────────────────────────────────

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

	// ─────────────────────────────────────────────
	// DELETE /routines/:id
	// ─────────────────────────────────────────────

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

	// ─────────────────────────────────────────────
	// POST /routines/:id/exercises
	// ─────────────────────────────────────────────

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
					exercise_id: exerciseId,
					target_sets: 4,
					target_reps_min: 6,
					target_reps_max: 10,
					target_rest_sec: 120,
				});

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("exercise_id", exerciseId);
			expect(res.body.data).toHaveProperty("routine_id", routineId);
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
					exercise_id: exerciseId,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
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
					exercise_id: exerciseId,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
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
					exercise_id: exerciseId,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exercise_id: exerciseId,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
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
					exercise_id: exRes.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			expect(res.status).toBe(404);
		});

		it("target_reps_max < target_reps_min → 400", async () => {
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
					exercise_id: exRes.body.data.id,
					target_sets: 3,
					target_reps_min: 12,
					target_reps_max: 8, // max < min
					target_rest_sec: 90,
				});

			expect(res.status).toBe(400);
		});
	});

	// ─────────────────────────────────────────────
	// POST /routines/:id/exercises/reorder
	// ─────────────────────────────────────────────

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
					exercise_id: ex1.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			const re2 = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exercise_id: ex2.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			const re1Id = re1.body.data.id;
			const re2Id = re2.body.data.id;

			// Reorder: swap them
			const reorderRes = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises/reorder`)
				.set(authHeader(accessToken))
				.send({
					exercises: [
						{ id: re1Id, order_index: 1 },
						{ id: re2Id, order_index: 0 },
					],
				});

			expect(reorderRes.status).toBe(200);

			// Verify new order
			const getRes = await request(app.getHttpServer())
				.get(`/routines/${routineId}`)
				.set(authHeader(accessToken));

			const reordered = getRes.body.data.routine_exercises;
			const firstItem = reordered.find((re: { id: string }) => re.id === re2Id);
			const secondItem = reordered.find((re: { id: string }) => re.id === re1Id);
			expect(firstItem.order_index).toBe(0);
			expect(secondItem.order_index).toBe(1);
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
					exercise_id: ex1.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			// Send a non-existent ID in reorder
			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises/reorder`)
				.set(authHeader(accessToken))
				.send({
					exercises: [{ id: "00000000-0000-0000-0000-000000000000", order_index: 0 }],
				});

			expect(res.status).toBe(400);
		});

		it("order_index duplicados en el payload → error", async () => {
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
					exercise_id: ex1.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			const re2 = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises`)
				.set(authHeader(accessToken))
				.send({
					exercise_id: ex2.body.data.id,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
				});

			// Both with same order_index
			const res = await request(app.getHttpServer())
				.post(`/routines/${routineId}/exercises/reorder`)
				.set(authHeader(accessToken))
				.send({
					exercises: [
						{ id: re1.body.data.id, order_index: 0 },
						{ id: re2.body.data.id, order_index: 0 },
					],
				});

			expect(res.status).toBe(400);
		});
	});
});
