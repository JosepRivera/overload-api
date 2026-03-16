import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module";
import { TransformInterceptor } from "@/common/transform.interceptor";
import { PrismaService } from "@/prisma/prisma.service";
import { authHeader, registerAndLogin } from "./helpers/auth.helper";
import { cleanDatabase } from "./helpers/db.helper";

describe("Sets E2E", () => {
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

	const validStartedAt = () => new Date(Date.now() - 60_000).toISOString();

	/** Helper: crea usuario + workout + ejercicio, devuelve los IDs y el token */
	async function setupWorkoutAndExercise() {
		const { accessToken } = await registerAndLogin(app);

		const workoutRes = await request(app.getHttpServer())
			.post("/workouts")
			.set(authHeader(accessToken))
			.send({ started_at: validStartedAt() });

		const workoutId = workoutRes.body.data.id;

		const exRes = await request(app.getHttpServer())
			.post("/exercises")
			.set(authHeader(accessToken))
			.send({ name: `Exercise-${Date.now()}`, category: "chest", type: "compound" });

		const exerciseId = exRes.body.data.id;

		return { accessToken, workoutId, exerciseId };
	}

	// ─────────────────────────────────────────────
	// POST /workouts/:workoutId/sets
	// ─────────────────────────────────────────────

	describe("POST /workouts/:workoutId/sets", () => {
		it("happy path: 201, set_number generado automáticamente desde 1", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("set_number", 1);
			expect(res.body.data).toHaveProperty("exercise_id", exerciseId);
			expect(res.body.data).toHaveProperty("weight", 100);
			expect(res.body.data).toHaveProperty("reps", 5);
		});

		it("segundo set mismo ejercicio mismo workout → set_number = 2", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 105, reps: 5 });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("set_number", 2);
		});

		it("is_warmup = true: set creado correctamente con is_warmup = true", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 60, reps: 10, is_warmup: true });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("is_warmup", true);
		});

		it("is_warmup = false (default): set creado con is_warmup = false", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("is_warmup", false);
		});

		it("weight = 0 válido (bodyweight)", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 0, reps: 10 });

			expect(res.status).toBe(201);
			expect(res.body.data).toHaveProperty("weight", 0);
		});

		it("ejercicio archivado → 409", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			await request(app.getHttpServer())
				.patch(`/exercises/${exerciseId}/archive`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			expect(res.status).toBe(409);
		});

		it("ejercicio de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { accessToken, workoutId } = await setupWorkoutAndExercise();

			const user2ExRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(user2.accessToken))
				.send({ name: "User2 Ex Sets", category: "back", type: "compound" });

			const user2ExId = user2ExRes.body.data.id;

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: user2ExId, weight: 100, reps: 5 });

			expect(res.status).toBe(404);
		});

		it("workout finalizado → 409", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/finish`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			expect(res.status).toBe(409);
		});

		it("workout de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(user2.accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			expect(res.status).toBe(404);
		});

		it("rpe fuera de rango (> 10) → 400", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5, rpe: 11 });

			expect(res.status).toBe(400);
		});

		it("rpe fuera de rango (< 1) → 400", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5, rpe: 0 });

			expect(res.status).toBe(400);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer())
				.post("/workouts/00000000-0000-0000-0000-000000000000/sets")
				.send({ exercise_id: "00000000-0000-0000-0000-000000000001", weight: 100, reps: 5 });

			expect(res.status).toBe(401);
		});
	});

	// ─────────────────────────────────────────────
	// GET /workouts/:workoutId/sets
	// ─────────────────────────────────────────────

	describe("GET /workouts/:workoutId/sets", () => {
		it("lista todos los sets incluidos warmups", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 60, reps: 10, is_warmup: true });

			await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5, is_warmup: false });

			const res = await request(app.getHttpServer())
				.get(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(2);

			const warmups = res.body.data.filter((s: { is_warmup: boolean }) => s.is_warmup);
			const working = res.body.data.filter((s: { is_warmup: boolean }) => !s.is_warmup);
			expect(warmups.length).toBe(1);
			expect(working.length).toBe(1);
		});

		it("workout de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { workoutId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.get(`/workouts/${workoutId}/sets`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});
	});

	// ─────────────────────────────────────────────
	// PATCH /workouts/:workoutId/sets/:id
	// ─────────────────────────────────────────────

	describe("PATCH /workouts/:workoutId/sets/:id", () => {
		it("happy path: 200", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const createRes = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			const setId = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.patch(`/workouts/${workoutId}/sets/${setId}`)
				.set(authHeader(accessToken))
				.send({ weight: 110, reps: 4 });

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveProperty("weight", 110);
			expect(res.body.data).toHaveProperty("reps", 4);
		});

		it("workout finalizado → 409", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const createRes = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			const setId = createRes.body.data.id;

			await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/finish`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.patch(`/workouts/${workoutId}/sets/${setId}`)
				.set(authHeader(accessToken))
				.send({ weight: 110 });

			expect(res.status).toBe(409);
		});

		it("workout de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { workoutId } = await setupWorkoutAndExercise();

			// We need a set ID — since user2 can't see the workout, even with a valid set ID
			const res = await request(app.getHttpServer())
				.patch(`/workouts/${workoutId}/sets/00000000-0000-0000-0000-000000000000`)
				.set(authHeader(user2.accessToken))
				.send({ weight: 110 });

			expect(res.status).toBe(404);
		});
	});

	// ─────────────────────────────────────────────
	// DELETE /workouts/:workoutId/sets/:id
	// ─────────────────────────────────────────────

	describe("DELETE /workouts/:workoutId/sets/:id", () => {
		it("happy path: 204", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const createRes = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			const setId = createRes.body.data.id;

			const res = await request(app.getHttpServer())
				.delete(`/workouts/${workoutId}/sets/${setId}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(204);
		});

		it("workout finalizado → 409", async () => {
			const { accessToken, workoutId, exerciseId } = await setupWorkoutAndExercise();

			const createRes = await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/sets`)
				.set(authHeader(accessToken))
				.send({ exercise_id: exerciseId, weight: 100, reps: 5 });

			const setId = createRes.body.data.id;

			await request(app.getHttpServer())
				.post(`/workouts/${workoutId}/finish`)
				.set(authHeader(accessToken));

			const res = await request(app.getHttpServer())
				.delete(`/workouts/${workoutId}/sets/${setId}`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(409);
		});

		it("workout de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { workoutId } = await setupWorkoutAndExercise();

			const res = await request(app.getHttpServer())
				.delete(`/workouts/${workoutId}/sets/00000000-0000-0000-0000-000000000000`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});
	});
});
