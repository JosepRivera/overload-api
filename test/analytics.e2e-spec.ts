import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import request from "supertest";
import { AppModule } from "@/app.module.ts";
import { TransformInterceptor } from "@/common/transform.interceptor.ts";
import { PrismaService } from "@/prisma/prisma.service.ts";
import { authHeader, registerAndLogin } from "./helpers/auth.helper.ts";
import { cleanDatabase } from "./helpers/db.helper.ts";

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
			.send({ startedAt: validStartedAt() });

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
			.send({ exerciseId: exerciseId, weight, reps, isWarmup: isWarmup });
	}


	describe("GET /analytics/exercises/:exerciseId/prs", () => {
		it("happy path: devuelve weightPr y volumePr correctos", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 100, 5);
			await addSet(accessToken, workoutId, exerciseId, 120, 3);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weightPr).toBe(120);
			expect(res.body.data.volumePr).toBe(500);
		});

		it("sin sets: weightPr = null, volumePr = null", async () => {
			const { accessToken, exerciseId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weightPr).toBeNull();
			expect(res.body.data.volumePr).toBeNull();
		});

		it("solo warmups: weightPr = null, volumePr = null", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 60, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 70, 8, true);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weightPr).toBeNull();
			expect(res.body.data.volumePr).toBeNull();
		});

		it("mix warmup + no-warmup: PRs calculados SOLO con no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 200, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);
			await addSet(accessToken, workoutId, exerciseId, 110, 4, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weightPr).toBe(110);
			expect(res.body.data.volumePr).toBe(500);
		});

		it("weightPr = mayor weight entre no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 80, 10, false);
			await addSet(accessToken, workoutId, exerciseId, 130, 1, false);
			await addSet(accessToken, workoutId, exerciseId, 110, 3, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.weightPr).toBe(130);
		});

		it("volumePr = mayor weight × reps entre no-warmup (no suma total)", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 50, 20, false);
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);
			await addSet(accessToken, workoutId, exerciseId, 80, 10, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/prs`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.volumePr).toBe(1000);
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


	describe("GET /analytics/exercises/:exerciseId/progression", () => {
		it("sessions ordenadas por fecha desc", async () => {
			const { accessToken } = await registerAndLogin(app);

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: `Progression Ex ${Date.now()}`, category: "back", type: "compound" });

			const exerciseId = exRes.body.data.id;

			const w1Res = await request(app.getHttpServer())
				.post("/workouts")
				.set(authHeader(accessToken))
				.send({ startedAt: new Date(Date.now() - 7200_000).toISOString() });
			const w1Id = w1Res.body.data.id;

			await addSet(accessToken, w1Id, exerciseId, 80, 8, false);

			await request(app.getHttpServer())
				.post(`/workouts/${w1Id}/finish`)
				.set(authHeader(accessToken));

			const w2Res = await request(app.getHttpServer())
				.post("/workouts")
				.set(authHeader(accessToken))
				.send({ startedAt: new Date(Date.now() - 3600_000).toISOString() });
			const w2Id = w2Res.body.data.id;

			await addSet(accessToken, w2Id, exerciseId, 90, 6, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(2);

			const dates = res.body.data.map((s: { date: string }) => new Date(s.date).getTime());
			expect(dates[0]).toBeGreaterThan(dates[1]);
		});

		it("warmups excluidos de totalVolume, avgWeight, avgReps", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 200, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/exercises/${exerciseId}/progression`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);

			const session = res.body.data[0];
			expect(session.totalVolume).toBe(500);
			expect(session.avgWeight).toBe(100);
			expect(session.avgReps).toBe(5);
		});

		it("?limit=5 respeta el límite", async () => {
			const { accessToken } = await registerAndLogin(app);

			const exRes = await request(app.getHttpServer())
				.post("/exercises")
				.set(authHeader(accessToken))
				.send({ name: `Limit Ex ${Date.now()}`, category: "legs", type: "compound" });

			const exerciseId = exRes.body.data.id;

			for (let i = 8; i >= 1; i--) {
				const wRes = await request(app.getHttpServer())
					.post("/workouts")
					.set(authHeader(accessToken))
					.send({ startedAt: new Date(Date.now() - i * 60_000).toISOString() });
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


	describe("GET /analytics/workouts/:workoutId/volume", () => {
		it("totalVolume = SUM(weight × reps) de no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);
			await addSet(accessToken, workoutId, exerciseId, 80, 8, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.totalVolume).toBe(1140);
		});

		it("solo warmups → totalVolume = 0", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 100, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 120, 8, true);

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.totalVolume).toBe(0);
		});

		it("mix warmup + no-warmup: solo cuenta no-warmup", async () => {
			const { accessToken, workoutId, exerciseId } = await setupBasic();

			await addSet(accessToken, workoutId, exerciseId, 200, 10, true);
			await addSet(accessToken, workoutId, exerciseId, 100, 5, false);

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.totalVolume).toBe(500);
		});

		it("sin sets → totalVolume = 0", async () => {
			const { accessToken, workoutId } = await setupBasic();

			const res = await request(app.getHttpServer())
				.get(`/analytics/workouts/${workoutId}/volume`)
				.set(authHeader(accessToken));

			expect(res.status).toBe(200);
			expect(res.body.data.totalVolume).toBe(0);
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
