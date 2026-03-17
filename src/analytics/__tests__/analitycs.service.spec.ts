import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "@/analytics/analytics.service";

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const prismaMock = {
	exercise: {
		findFirst: vi.fn(),
	},
	workout: {
		findUnique: vi.fn(),
	},
	set: {
		aggregate: vi.fn(),
		findMany: vi.fn(),
	},
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = "user-uuid-1";
const EXERCISE_ID = "exercise-uuid-1";
const WORKOUT_ID = "workout-uuid-1";

function makeSet(
	weight: number,
	reps: number,
	workoutId = WORKOUT_ID,
	startedAt = new Date("2026-01-10"),
) {
	return {
		workout_id: workoutId,
		weight: weight.toString(), // Prisma Decimal comes as string
		reps,
		workout: { started_at: startedAt },
	};
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("AnalyticsService", () => {
	let service: AnalyticsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AnalyticsService(prismaMock as never);
	});

	// -------------------------------------------------------------------------
	// getExercisePrs
	// -------------------------------------------------------------------------

	describe("getExercisePrs", () => {
		beforeEach(() => {
			prismaMock.exercise.findFirst.mockResolvedValue({ id: EXERCISE_ID });
		});

		it("returns weight_pr and volume_pr from non-warmup sets", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: "100" } });
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(100, 5), // volume = 500
				makeSet(80, 8), // volume = 640  ← volume PR
			]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weight_pr).toBe(100);
			expect(result.volume_pr).toBe(640);
		});

		it("returns null for both PRs when there are no sets", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: null } });
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weight_pr).toBeNull();
			expect(result.volume_pr).toBeNull();
		});

		it("picks the correct volume PR when multiple sets have different weight×reps", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: "120" } });
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(120, 1), // volume = 120
				makeSet(100, 3), // volume = 300
				makeSet(80, 5), // volume = 400  ← volume PR
				makeSet(60, 6), // volume = 360
			]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weight_pr).toBe(120);
			expect(result.volume_pr).toBe(400);
		});

		it("handles bodyweight sets (weight = 0) correctly", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: "0" } });
			prismaMock.set.findMany.mockResolvedValue([makeSet(0, 20)]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weight_pr).toBe(0); // ← era toBeNull(), estaba mal
			expect(result.volume_pr).toBe(0);
		});

		it("throws NotFoundException when exercise does not belong to user", async () => {
			prismaMock.exercise.findFirst.mockResolvedValue(null);

			await expect(service.getExercisePrs(USER_ID, EXERCISE_ID)).rejects.toThrow(NotFoundException);
		});
	});

	// -------------------------------------------------------------------------
	// getExercise1rm
	// -------------------------------------------------------------------------

	describe("getExercise1rm", () => {
		beforeEach(() => {
			prismaMock.exercise.findFirst.mockResolvedValue({ id: EXERCISE_ID });
		});

		it("returns estimated_1rm and based_on using Epley formula", async () => {
			// 100kg × (1 + 5/30) = 100 × 1.1667 = 116.7
			prismaMock.set.findMany.mockResolvedValue([{ weight: "100", reps: 5 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.exercise_id).toBe(EXERCISE_ID);
			expect(result.estimated_1rm).toBeCloseTo(116.7, 1);
			expect(result.based_on).toEqual({ weight: 100, reps: 5 });
		});

		it("picks the set with the highest estimated 1RM, not the heaviest weight", async () => {
			// 90kg×3  → 90 × (1 + 3/30)  = 90 × 1.1   = 99.0
			// 80kg×8  → 80 × (1 + 8/30)  = 80 × 1.267  = 101.3  ← winner
			prismaMock.set.findMany.mockResolvedValue([
				{ weight: "90", reps: 3 },
				{ weight: "80", reps: 8 },
			]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.based_on).toEqual({ weight: 80, reps: 8 });
			expect(result.estimated_1rm).toBeCloseTo(101.3, 1);
		});

		it("returns null fields when there are no eligible sets (reps <= 10, non-warmup)", async () => {
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated_1rm).toBeNull();
			expect(result.based_on).toBeNull();
		});

		it("correctly applies Epley for a single-rep set (reps = 1)", async () => {
			// 150kg × (1 + 1/30) = 150 × 1.0333 = 155.0
			prismaMock.set.findMany.mockResolvedValue([{ weight: "150", reps: 1 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated_1rm).toBeCloseTo(155.0, 1);
			expect(result.based_on).toEqual({ weight: 150, reps: 1 });
		});

		it("correctly applies Epley at the reps = 10 boundary", async () => {
			// 100kg × (1 + 10/30) = 100 × 1.333 = 133.3
			prismaMock.set.findMany.mockResolvedValue([{ weight: "100", reps: 10 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated_1rm).toBeCloseTo(133.3, 1);
		});

		it("ignores sets with reps > 10 (Prisma filter handles this, service receives empty)", async () => {
			// Simulates the DB already filtering out reps > 10 via the query
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated_1rm).toBeNull();
		});

		it("returns estimated_1rm rounded to 1 decimal place", async () => {
			// 95kg × (1 + 7/30) = 95 × 1.2333 = 117.17 → rounded to 117.2
			prismaMock.set.findMany.mockResolvedValue([{ weight: "95", reps: 7 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated_1rm).toBe(117.2);
		});

		it("handles bodyweight sets (weight = 0) — returns 0 1RM", async () => {
			prismaMock.set.findMany.mockResolvedValue([{ weight: "0", reps: 5 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated_1rm).toBe(0);
			expect(result.based_on).toEqual({ weight: 0, reps: 5 });
		});

		it("throws NotFoundException when exercise does not belong to user", async () => {
			prismaMock.exercise.findFirst.mockResolvedValue(null);

			await expect(service.getExercise1rm(USER_ID, EXERCISE_ID)).rejects.toThrow(NotFoundException);
		});
	});

	// -------------------------------------------------------------------------
	// getWorkoutVolume
	// -------------------------------------------------------------------------

	describe("getWorkoutVolume", () => {
		beforeEach(() => {
			prismaMock.workout.findUnique.mockResolvedValue({ id: WORKOUT_ID });
		});

		it("calculates total volume as sum of weight×reps for non-warmup sets", async () => {
			prismaMock.set.findMany.mockResolvedValue([
				{ weight: "100", reps: 5 }, // 500
				{ weight: "80", reps: 8 }, // 640
				{ weight: "60", reps: 10 }, // 600
			]);

			const result = await service.getWorkoutVolume(USER_ID, WORKOUT_ID);

			expect(result.workout_id).toBe(WORKOUT_ID);
			expect(result.total_volume).toBe(1740);
		});

		it("returns 0 volume when workout has no non-warmup sets", async () => {
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getWorkoutVolume(USER_ID, WORKOUT_ID);

			expect(result.total_volume).toBe(0);
		});

		it("returns 0 volume for a bodyweight-only workout", async () => {
			prismaMock.set.findMany.mockResolvedValue([
				{ weight: "0", reps: 15 },
				{ weight: "0", reps: 12 },
			]);

			const result = await service.getWorkoutVolume(USER_ID, WORKOUT_ID);

			expect(result.total_volume).toBe(0);
		});

		it("throws NotFoundException when workout does not belong to user", async () => {
			prismaMock.workout.findUnique.mockResolvedValue(null);

			await expect(service.getWorkoutVolume(USER_ID, WORKOUT_ID)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	// -------------------------------------------------------------------------
	// getExerciseProgression
	// -------------------------------------------------------------------------

	describe("getExerciseProgression", () => {
		beforeEach(() => {
			prismaMock.exercise.findFirst.mockResolvedValue({ id: EXERCISE_ID });
		});

		it("groups sets by workout and computes avg_weight, avg_reps and total_volume per session", async () => {
			const date = new Date("2026-01-15");
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(100, 5, WORKOUT_ID, date),
				makeSet(100, 5, WORKOUT_ID, date),
			]);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 });

			expect(result).toHaveLength(1);
			expect(result[0].workout_id).toBe(WORKOUT_ID);
			expect(result[0].total_volume).toBe(1000);
			expect(result[0].avg_weight).toBe(100);
			expect(result[0].avg_reps).toBe(5);
			expect(result[0].date).toEqual(date);
		});

		it("separates sets from different workouts into different sessions", async () => {
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(80, 8, "workout-A", new Date("2026-01-10")),
				makeSet(100, 5, "workout-B", new Date("2026-01-17")),
			]);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 });

			expect(result).toHaveLength(2);
		});

		it("returns sessions ordered by date descending (most recent first)", async () => {
			const old = new Date("2026-01-01");
			const mid = new Date("2026-01-08");
			const recent = new Date("2026-01-15");

			prismaMock.set.findMany.mockResolvedValue([
				makeSet(80, 5, "workout-A", old),
				makeSet(90, 5, "workout-C", recent),
				makeSet(85, 5, "workout-B", mid),
			]);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 });

			expect(result[0].date).toEqual(recent);
			expect(result[1].date).toEqual(mid);
			expect(result[2].date).toEqual(old);
		});

		it("respects the limit query parameter", async () => {
			const sets = Array.from({ length: 10 }, (_, i) =>
				makeSet(100, 5, `workout-${i}`, new Date(`2026-01-${String(i + 1).padStart(2, "0")}`)),
			);
			prismaMock.set.findMany.mockResolvedValue(sets);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 3 });

			expect(result).toHaveLength(3);
		});

		it("returns empty array when the exercise has no logged sets", async () => {
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 });

			expect(result).toEqual([]);
		});

		it("correctly averages weight and reps within a session with mixed weights", async () => {
			const date = new Date("2026-01-20");
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(100, 5, WORKOUT_ID, date),
				makeSet(80, 10, WORKOUT_ID, date),
			]);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 });

			expect(result[0].avg_weight).toBe(90);
			expect(result[0].avg_reps).toBe(7.5);
			expect(result[0].total_volume).toBe(1300);
		});

		it("throws NotFoundException when exercise does not belong to user", async () => {
			prismaMock.exercise.findFirst.mockResolvedValue(null);

			await expect(
				service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 }),
			).rejects.toThrow(NotFoundException);
		});
	});
});
