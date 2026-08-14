import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "@/analytics/analytics.service.js";

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
		workoutId,
		weight: weight.toString(),
		reps,
		workout: { startedAt },
	};
}

describe("AnalyticsService", () => {
	let service: AnalyticsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AnalyticsService(prismaMock as never);
	});

	describe("getExercisePrs", () => {
		beforeEach(() => {
			prismaMock.exercise.findFirst.mockResolvedValue({ id: EXERCISE_ID });
		});

		it("returns weightPr and volumePr from non-warmup sets", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: "100" } });
			prismaMock.set.findMany.mockResolvedValue([makeSet(100, 5), makeSet(80, 8)]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weightPr).toBe(100);
			expect(result.volumePr).toBe(640);
		});

		it("returns null for both PRs when there are no sets", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: null } });
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weightPr).toBeNull();
			expect(result.volumePr).toBeNull();
		});

		it("picks the correct volume PR when multiple sets have different weight×reps", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: "120" } });
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(120, 1),
				makeSet(100, 3),
				makeSet(80, 5),
				makeSet(60, 6),
			]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weightPr).toBe(120);
			expect(result.volumePr).toBe(400);
		});

		it("handles bodyweight sets (weight = 0) correctly", async () => {
			prismaMock.set.aggregate.mockResolvedValue({ _max: { weight: "0" } });
			prismaMock.set.findMany.mockResolvedValue([makeSet(0, 20)]);

			const result = await service.getExercisePrs(USER_ID, EXERCISE_ID);

			expect(result.weightPr).toBe(0);
			expect(result.volumePr).toBe(0);
		});

		it("throws NotFoundException when exercise does not belong to user", async () => {
			prismaMock.exercise.findFirst.mockResolvedValue(null);

			await expect(service.getExercisePrs(USER_ID, EXERCISE_ID)).rejects.toThrow(NotFoundException);
		});
	});

	describe("getExercise1rm", () => {
		beforeEach(() => {
			prismaMock.exercise.findFirst.mockResolvedValue({ id: EXERCISE_ID });
		});

		it("returns estimated1rm and basedOn using Epley formula", async () => {
			prismaMock.set.findMany.mockResolvedValue([{ weight: "100", reps: 5 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.exerciseId).toBe(EXERCISE_ID);
			expect(result.estimated1rm).toBeCloseTo(116.7, 1);
			expect(result.basedOn).toEqual({ weight: 100, reps: 5 });
		});

		it("picks the set with the highest estimated 1RM, not the heaviest weight", async () => {
			prismaMock.set.findMany.mockResolvedValue([
				{ weight: "90", reps: 3 },
				{ weight: "80", reps: 8 },
			]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.basedOn).toEqual({ weight: 80, reps: 8 });
			expect(result.estimated1rm).toBeCloseTo(101.3, 1);
		});

		it("returns null fields when there are no eligible sets (reps <= 10, non-warmup)", async () => {
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated1rm).toBeNull();
			expect(result.basedOn).toBeNull();
		});

		it("correctly applies Epley for a single-rep set (reps = 1)", async () => {
			prismaMock.set.findMany.mockResolvedValue([{ weight: "150", reps: 1 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated1rm).toBeCloseTo(155.0, 1);
			expect(result.basedOn).toEqual({ weight: 150, reps: 1 });
		});

		it("correctly applies Epley at the reps = 10 boundary", async () => {
			prismaMock.set.findMany.mockResolvedValue([{ weight: "100", reps: 10 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated1rm).toBeCloseTo(133.3, 1);
		});

		it("ignores sets with reps > 10 (Prisma filter handles this, service receives empty)", async () => {
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated1rm).toBeNull();
		});

		it("returns estimated1rm rounded to 1 decimal place", async () => {
			prismaMock.set.findMany.mockResolvedValue([{ weight: "95", reps: 7 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated1rm).toBe(117.2);
		});

		it("handles bodyweight sets (weight = 0) — returns 0 1RM", async () => {
			prismaMock.set.findMany.mockResolvedValue([{ weight: "0", reps: 5 }]);

			const result = await service.getExercise1rm(USER_ID, EXERCISE_ID);

			expect(result.estimated1rm).toBe(0);
			expect(result.basedOn).toEqual({ weight: 0, reps: 5 });
		});

		it("throws NotFoundException when exercise does not belong to user", async () => {
			prismaMock.exercise.findFirst.mockResolvedValue(null);

			await expect(service.getExercise1rm(USER_ID, EXERCISE_ID)).rejects.toThrow(NotFoundException);
		});
	});

	describe("getWorkoutVolume", () => {
		beforeEach(() => {
			prismaMock.workout.findUnique.mockResolvedValue({ id: WORKOUT_ID });
		});

		it("calculates total volume as sum of weight×reps for non-warmup sets", async () => {
			prismaMock.set.findMany.mockResolvedValue([
				{ weight: "100", reps: 5 },
				{ weight: "80", reps: 8 },
				{ weight: "60", reps: 10 },
			]);

			const result = await service.getWorkoutVolume(USER_ID, WORKOUT_ID);

			expect(result.workoutId).toBe(WORKOUT_ID);
			expect(result.totalVolume).toBe(1740);
		});

		it("returns 0 volume when workout has no non-warmup sets", async () => {
			prismaMock.set.findMany.mockResolvedValue([]);

			const result = await service.getWorkoutVolume(USER_ID, WORKOUT_ID);

			expect(result.totalVolume).toBe(0);
		});

		it("returns 0 volume for a bodyweight-only workout", async () => {
			prismaMock.set.findMany.mockResolvedValue([
				{ weight: "0", reps: 15 },
				{ weight: "0", reps: 12 },
			]);

			const result = await service.getWorkoutVolume(USER_ID, WORKOUT_ID);

			expect(result.totalVolume).toBe(0);
		});

		it("throws NotFoundException when workout does not belong to user", async () => {
			prismaMock.workout.findUnique.mockResolvedValue(null);

			await expect(service.getWorkoutVolume(USER_ID, WORKOUT_ID)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("getExerciseProgression", () => {
		beforeEach(() => {
			prismaMock.exercise.findFirst.mockResolvedValue({ id: EXERCISE_ID });
		});

		it("groups sets by workout and computes avgWeight, avgReps and totalVolume per session", async () => {
			const date = new Date("2026-01-15");
			prismaMock.set.findMany.mockResolvedValue([
				makeSet(100, 5, WORKOUT_ID, date),
				makeSet(100, 5, WORKOUT_ID, date),
			]);

			const result = await service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 });

			expect(result).toHaveLength(1);
			expect(result[0]?.workoutId).toBe(WORKOUT_ID);
			expect(result[0]?.totalVolume).toBe(1000);
			expect(result[0]?.avgWeight).toBe(100);
			expect(result[0]?.avgReps).toBe(5);
			expect(result[0]?.date).toEqual(date);
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

			expect(result[0]?.date).toEqual(recent);
			expect(result[1]?.date).toEqual(mid);
			expect(result[2]?.date).toEqual(old);
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

			expect(result[0]?.avgWeight).toBe(90);
			expect(result[0]?.avgReps).toBe(7.5);
			expect(result[0]?.totalVolume).toBe(1300);
		});

		it("throws NotFoundException when exercise does not belong to user", async () => {
			prismaMock.exercise.findFirst.mockResolvedValue(null);

			await expect(
				service.getExerciseProgression(USER_ID, EXERCISE_ID, { limit: 20 }),
			).rejects.toThrow(NotFoundException);
		});
	});
});
