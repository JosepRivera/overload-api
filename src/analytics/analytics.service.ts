import { Injectable, NotFoundException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service.js";
import type {
	Exercise1RM,
	ExercisePrs,
	SessionProgression,
	WorkoutVolume,
} from "../analytics/interfaces/analytics.interface.js";
import type { ProgressionQueryInput } from "./dto/progression-query.dto.js";

@Injectable()
export class AnalyticsService {
	constructor(private prisma: PrismaService) {}

	async getExercisePrs(userId: string, exerciseId: string): Promise<ExercisePrs> {
		await this.assertExerciseAccess(userId, exerciseId);

		const aggregate = await this.prisma.set.aggregate({
			where: { exerciseId, isWarmup: false },
			_max: { weight: true },
		});

		const sets = await this.prisma.set.findMany({
			where: { exerciseId, isWarmup: false },
			select: { weight: true, reps: true },
		});

		const weightPr = aggregate._max.weight !== null ? Number(aggregate._max.weight) : null;
		const volumes = sets.map((s) => Number(s.weight) * s.reps);
		const volumePr = volumes.length > 0 ? Math.max(...volumes) : null;

		return { weightPr, volumePr };
	}

	async getExercise1rm(userId: string, exerciseId: string): Promise<Exercise1RM> {
		await this.assertExerciseAccess(userId, exerciseId);

		const sets = await this.prisma.set.findMany({
			where: {
				exerciseId,
				isWarmup: false,
				reps: { lte: 10 },
			},
			select: { weight: true, reps: true },
		});

		if (sets.length === 0) {
			return { exerciseId, estimated1rm: null, basedOn: null };
		}

		let best: { weight: number; reps: number; estimated: number } | null = null;

		for (const s of sets) {
			const weight = Number(s.weight);
			const estimated = weight * (1 + s.reps / 30.0);

			if (best === null || estimated > best.estimated) {
				best = { weight, reps: s.reps, estimated };
			}
		}

		// biome-ignore lint/style/noNonNullAssertion: guarded by sets.length check above
		const { weight, reps, estimated } = best!;

		return {
			exerciseId,
			estimated1rm: Math.round(estimated * 10) / 10,
			basedOn: { weight, reps },
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
				exerciseId,
				isWarmup: false,
			},
			select: {
				workoutId: true,
				weight: true,
				reps: true,
				workout: {
					select: { startedAt: true },
				},
			},
		});

		const grouped = new Map<string, typeof sets>();

		for (const set of sets) {
			const existing = grouped.get(set.workoutId);
			if (existing) {
				existing.push(set);
			} else {
				grouped.set(set.workoutId, [set]);
			}
		}

		const progression: SessionProgression[] = [];

		for (const [workoutId, workoutSets] of grouped) {
			const totalVolume = workoutSets.reduce((acc, s) => acc + Number(s.weight) * s.reps, 0);
			const avgWeight =
				workoutSets.reduce((acc, s) => acc + Number(s.weight), 0) / workoutSets.length;
			const avgReps = workoutSets.reduce((acc, s) => acc + s.reps, 0) / workoutSets.length;

			progression.push({
				workoutId,
				date: workoutSets[0]?.workout.startedAt ?? new Date(),
				totalVolume,
				avgWeight,
				avgReps,
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
			where: { workoutId, isWarmup: false },
			select: { weight: true, reps: true },
		});

		const totalVolume = sets.reduce((acc, s) => acc + Number(s.weight) * s.reps, 0);

		return { workoutId, totalVolume };
	}

	private async assertExerciseAccess(userId: string, exerciseId: string) {
		const exercise = await this.prisma.exercise.findFirst({
			where: { id: exerciseId, userId },
		});

		if (!exercise) {
			throw new NotFoundException("Exercise not found");
		}

		return exercise;
	}

	private async assertWorkoutAccess(userId: string, workoutId: string) {
		const workout = await this.prisma.workout.findUnique({
			where: { id: workoutId, userId },
		});

		if (!workout) {
			throw new NotFoundException("Workout not found");
		}

		return workout;
	}
}
