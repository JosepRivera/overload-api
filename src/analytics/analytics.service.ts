import { Injectable, NotFoundException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service";
import type {
	Exercise1RM,
	ExercisePrs,
	SessionProgression,
	WorkoutVolume,
} from "../analytics/interfaces/analytics.interface";
import type { ProgressionQueryInput } from "./dto/progression-query.dto";

@Injectable()
export class AnalyticsService {
	constructor(private prisma: PrismaService) {}

	async getExercisePrs(userId: string, exerciseId: string): Promise<ExercisePrs> {
		await this.assertExerciseAccess(userId, exerciseId);

		const aggregate = await this.prisma.set.aggregate({
			where: { exercise_id: exerciseId, is_warmup: false },
			_max: { weight: true },
		});

		const sets = await this.prisma.set.findMany({
			where: { exercise_id: exerciseId, is_warmup: false },
			select: { weight: true, reps: true },
		});

		const weightPr = aggregate._max.weight !== null ? Number(aggregate._max.weight) : null;
		const volumes = sets.map((s) => Number(s.weight) * s.reps);
		const volumePr = volumes.length > 0 ? Math.max(...volumes) : null;

		return { weight_pr: weightPr, volume_pr: volumePr };
	}

	async getExercise1rm(userId: string, exerciseId: string): Promise<Exercise1RM> {
		await this.assertExerciseAccess(userId, exerciseId);

		const sets = await this.prisma.set.findMany({
			where: {
				exercise_id: exerciseId,
				is_warmup: false,
				reps: { lte: 10 },
			},
			select: { weight: true, reps: true },
		});

		if (sets.length === 0) {
			return { exercise_id: exerciseId, estimated_1rm: null, based_on: null };
		}

		// Pick the set that yields the highest estimated 1RM, not just the heaviest weight.
		// e.g. 90kg×3 → 99, but 80kg×8 → 101.3 — the latter is the better estimate.
		let best: { weight: number; reps: number; estimated: number } | null = null;

		for (const s of sets) {
			const weight = Number(s.weight);
			const estimated = weight * (1 + s.reps / 30.0);

			if (best === null || estimated > best.estimated) {
				best = { weight, reps: s.reps, estimated };
			}
		}

		// best is guaranteed non-null here (sets.length > 0)
		// biome-ignore lint/style/noNonNullAssertion: guarded by sets.length check above
		const { weight, reps, estimated } = best!;

		return {
			exercise_id: exerciseId,
			estimated_1rm: Math.round(estimated * 10) / 10, // 1 decimal place
			based_on: { weight, reps },
		};
	}

	async getExerciseProgression(
		userId: string,
		exerciseId: string,
		query: ProgressionQueryInput,
	): Promise<SessionProgression[]> {
		await this.assertExerciseAccess(userId, exerciseId);

		const sets = await this.prisma.set.findMany({
			where: {
				exercise_id: exerciseId,
				is_warmup: false,
			},
			select: {
				workout_id: true,
				weight: true,
				reps: true,
				workout: {
					select: { started_at: true },
				},
			},
		});

		const grouped = new Map<string, typeof sets>();

		for (const set of sets) {
			const existing = grouped.get(set.workout_id);
			if (existing) {
				existing.push(set);
			} else {
				grouped.set(set.workout_id, [set]);
			}
		}

		const progression: SessionProgression[] = [];

		for (const [workoutId, workoutSets] of grouped) {
			const totalVolume = workoutSets.reduce((acc, s) => acc + Number(s.weight) * s.reps, 0);
			const avgWeight =
				workoutSets.reduce((acc, s) => acc + Number(s.weight), 0) / workoutSets.length;
			const avgReps = workoutSets.reduce((acc, s) => acc + s.reps, 0) / workoutSets.length;

			progression.push({
				workout_id: workoutId,
				date: workoutSets[0].workout.started_at,
				total_volume: totalVolume,
				avg_weight: avgWeight,
				avg_reps: avgReps,
			});
		}

		const sorted = progression
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.slice(0, query.limit);

		return sorted;
	}

	async getWorkoutVolume(userId: string, workoutId: string): Promise<WorkoutVolume> {
		await this.assertWorkoutAccess(userId, workoutId);

		const sets = await this.prisma.set.findMany({
			where: { workout_id: workoutId, is_warmup: false },
			select: { weight: true, reps: true },
		});

		const totalVolume = sets.reduce((acc, s) => acc + Number(s.weight) * s.reps, 0);

		return { workout_id: workoutId, total_volume: totalVolume };
	}

	private async assertExerciseAccess(userId: string, exerciseId: string) {
		const exercise = await this.prisma.exercise.findFirst({
			where: { id: exerciseId, user_id: userId },
		});

		if (!exercise) {
			throw new NotFoundException("Exercise not found");
		}

		return exercise;
	}

	private async assertWorkoutAccess(userId: string, workoutId: string) {
		const workout = await this.prisma.workout.findUnique({
			where: { id: workoutId, user_id: userId },
		});

		if (!workout) {
			throw new NotFoundException("Workout not found");
		}

		return workout;
	}
}
