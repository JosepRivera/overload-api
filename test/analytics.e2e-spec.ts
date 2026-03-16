import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module";
import { TransformInterceptor } from "@/common/transform.interceptor";
import { PrismaService } from "@/prisma/prisma.service";
import { authHeader, registerAndLogin } from "./helpers/auth.helper";
import { cleanDatabase } from "./helpers/db.helper";

describe("Analytics E2E", () => {
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

	/** Setup: user + workout (active) + exercise */
	async function setupBasic() {
		const { accessToken } = await registerAndLogin(app);

		const workoutRes = await request(app.getHttpServer())
			.post("/workouts")
			.set(authHeader(accessToken))
			.send({ started_at: validStartedAt() });

		const workoutId = workoutRes.body.data.id;

		const exRes = await request(app.getHttpServer())
			.post("/exercises")
			.set(authHeader(accessToken))
			.send({ name: `Ex-${Date.now()}`, category: "chest", type: "compound" });

		const exerciseId = exRes.body.data.id;

		return { accessToken, workoutId, exerciseId };
	}

	/** Add a set to the workout */
	async function addSet(
		accessToken: string,
		workoutId: string,
		exerciseId: string,
		weight: number,
		reps: number,
		isWarmup = false,
	) {
		return request(app.getHttpServer())
			.post(`/workouts/${workoutId}/sets`)
			.set(authHeader(accessToken))
			.send({ exercise_id: exerciseId, weight, reps, is_warmup: isWarmup });
	}

	// ─────────────────────────────────────────────
	// GET /analytics/exercises/:exerciseId/prs
	// ─────────────────────────────────────────────

	describe("GET /analytics/exercises/:exerciseId/prs", () => {
		it("happy path: devuelve weight_pr y volume_pr correctos", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 100, 5);
			await addSet(accessToken, workoutId, exerciseId, 120, 3);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			// weight_pr = max weight = 120
			expect(res.body.data.weight_pr).toBe(120);
			// volume_pr = max(weight * reps) = max(100*5=500, 120*3=360) = 500
			expect(res.body.data.volume_pr).toBe(500);
		});

		it("sin sets: weight_pr = null, volume_pr = null", async () => {
			const { accessToken, exerciseId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weight_pr).toBeNull();
			expect(res.body.data.volume_pr).toBeNull();
		});

		it("solo warmups: weight_pr = null, volume_pr = null", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 60, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 70, 8, true);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weight_pr).toBeNull();
			expect(res.body.data.volume_pr).toBeNull();
		});

		it("mix warmup + no-warmup: PRs calculados SOLO con no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			// Warmup sets — high weight but should be excluded
			await addSet(accessToken, workoutId, exerciseId, 200, 10, true);
			// Working sets
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);
			await addSet(accessToken, workoutId, exerciseId, 110, 4, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			// weight_pr must ignore warmup (200), so max of [100, 110] = 110
			expect(res.body.data.weight_pr).toBe(110);
			// volume_pr = max(100*5=500, 110*4=440) = 500, NOT including 200*10=2000 (warmup)
			expect(res.body.data.volume_pr).toBe(500);
		});

		it("weight_pr = mayor weight entre no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 80, 10, false);
			await addSet(accessToken, workoutId, exerciseId, 130, 1, false);
			await addSet(accessToken, workoutId, exerciseId, 110, 3, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weight_pr).toBe(130);
		});

		it("volume_pr = mayor weight × reps entre no-warmup (no suma total)", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			// set1: 50 * 20 = 1000
			// set2: 100 * 5 = 500
			// set3: 80 * 10 = 800
			// volume_pr = 1000 (set1)
			await addSet(accessToken, workoutId, exerciseId, 50, 20, false);
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);
			await addSet(accessToken, workoutId, exerciseId, 80, 10, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.volume_pr).toBe(1000);
		});

		it("ejercicio de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { exerciseId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});

		it("sin token → 401", async () => {
			const res = await request(app.getHttpServer()).get(
				"/analytics/exercises/00000000-0000-0000-0000-000000000000/prs",
			);
			expect(res.status).toBe(401);
		});
	});

	// ─────────────────────────────────────────────
	// GET /analytics/exercises/:exerciseId/progression
	// ─────────────────────────────────────────────

	describe("GET /analytics/exercises/:exerciseId/progression", () => {
		it("sessions ordenadas por fecha desc", async () => {
			const { accessToken } = await registerAndLogin(app);

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: `Progression Ex ${Date.now()}`, category: "back", type: "compound" });

			const exerciseId = exRes.body.data.id;

			// Create two workouts with different started_at
			const w1Res = await request(app.getHttpServer())
				.post("/workouts")
				.set(authHeader(accessToken))
				.send({ started_at: new Date(Date.now() - 7200_000).toISOString() }); // 2h ago
			const w1Id = w1Res.body.data.id;

			await addSet(accessToken, w1Id, exerciseId, 80, 8, false);

			await request(app.getHttpServer())
				.post(`/workouts/${w1Id}/finish`)
				.set(authHeader(accessToken));

			const w2Res = await request(app.getHttpServer())
				.post("/workouts")
				.set(authHeader(accessToken))
				.send({ started_at: new Date(Date.now() - 3600_000).toISOString() }); // 1h ago
			const w2Id = w2Res.body.data.id;

			await addSet(accessToken, w2Id, exerciseId, 90, 6, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(2);

			// Most recent first
			const dates = res.body.data.map((s: { date: string }) => new Date(s.date).getTime());
			expect(dates[0]).toBeGreaterThan(dates[1]);
		});

		it("warmups excluidos de total_volume, avg_weight, avg_reps", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			// Warmup set: should be excluded
			await addSet(accessToken, workoutId, exerciseId, 200, 10, true);
			// Working set: should be included
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);

			const session = res.body.data[0];
			// Only the working set: total_volume = 100 * 5 = 500
			expect(session.total_volume).toBe(500);
			// avg_weight = 100 (only working set)
			expect(session.avg_weight).toBe(100);
			// avg_reps = 5 (only working set)
			expect(session.avg_reps).toBe(5);
		});

		it("?limit=5 respeta el límite", async () => {
			const { accessToken } = await registerAndLogin(app);

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: `Limit Ex ${Date.now()}`, category: "legs", type: "compound" });

			const exerciseId = exRes.body.data.id;

			// Create 8 workouts with sets
			for (let i = 8; i >= 1; i--) {
				const wRes = await request(app.getHttpServer())
					.post("/workouts")
					.set(authHeader(accessToken))
					.send({ started_at: new Date(Date.now() - i * 60_000).toISOString() }); // minutos, no horas
				const wId = wRes.body.data.id;
				await addSet(accessToken, wId, exerciseId, 100, 5, false);
				await request(app.getHttpServer())
					.post(`/workouts/${wId}/finish`)
					.set(authHeader(accessToken));
			}

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression?limit=5`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(5);
		});

		it("sin sets: array vacío", async () => {
			const { accessToken, exerciseId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data).toEqual([]);
		});

		it("ejercicio de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { exerciseId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});
	});

	// ─────────────────────────────────────────────
	// GET /analytics/workouts/:workoutId/volume
	// ─────────────────────────────────────────────

	describe("GET /analytics/workouts/:workoutId/volume", () => {
		it("total_volume = SUM(weight × reps) de no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 100, 5, false); // 500
			await addSet(accessToken, workoutId, exerciseId, 80, 8, false); // 640

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.total_volume).toBe(1140); // 500 + 640
		});

		it("solo warmups → total_volume = 0", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 100, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 120, 8, true);

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.total_volume).toBe(0);
		});

		it("mix warmup + no-warmup: solo cuenta no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 200, 10, true); // warmup: 2000 — excluded
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false); // 500

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.total_volume).toBe(500);
		});

		it("sin sets → total_volume = 0", async () => {
			const { accessToken, workoutId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.total_volume).toBe(0);
		});

		it("workout de otro usuario → 404", async () => {
			const user2 = await registerAndLogin(app);
			const { workoutId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(user2.accessToken));

			expect(res.status).toBe(404);
		});
	});
});
