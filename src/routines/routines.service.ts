import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { ExerciseService } from "@/exercise/exercise.service";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service";
import type { AddRoutineExerciseInput } from "./dto/add-routine-exercise.dto";
import type { CreateRoutineInput } from "./dto/create-routine.dto";
import type { ReorderRoutineExercisesInput } from "./dto/reorder-routine-exercises.dto";
import type { UpdateRoutineInput } from "./dto/update-routine.dto";
import type { UpdateRoutineExerciseInput } from "./dto/update-routine-exercise.dto";

@Injectable()
export class RoutinesService {
	constructor(
		private prisma: PrismaService,
		private exerciseService: ExerciseService,
	) {}

	// ─────────────────────────────────────────────
	// ROUTINE CRUD
	// ─────────────────────────────────────────────

	async create(userId: string, input: CreateRoutineInput) {
		await this.assertUniqueNameForUser(userId, input.name);

		return this.prisma.routine.create({
			data: {
				user_id: userId,
				name: input.name,
				description: input.description ?? null,
			},
		});
	}

	async findAll(userId: string) {
		return this.prisma.routine.findMany({
			where: { user_id: userId, is_active: true },
			orderBy: { name: "asc" },
		});
	}

	async findOne(userId: string, id: string) {
		const routine = await this.prisma.routine.findFirst({
			where: { id, user_id: userId },
			include: {
				routine_exercises: {
					orderBy: { order_index: "asc" },
					include: {
						exercise: {
							select: {
								id: true,
								name: true,
								category: true,
								type: true,
								is_archived: true,
							},
						},
					},
				},
			},
		});

		if (!routine) {
			throw new NotFoundException("Routine not found");
		}

		return routine;
	}

	async update(userId: string, id: string, input: UpdateRoutineInput) {
		await this.findOne(userId, id);

		if (input.name !== undefined) {
			await this.assertUniqueNameForUser(userId, input.name, id);
		}

		return this.prisma.routine.update({
			where: { id },
			data: {
				...(input.name !== undefined && { name: input.name }),
				...(input.description !== undefined && { description: input.description }),
			},
		});
	}

	async deactivate(userId: string, id: string) {
		await this.findOne(userId, id);

		await this.prisma.routine.update({
			where: { id },
			data: { is_active: false },
		});
	}

	// ─────────────────────────────────────────────
	// ROUTINE EXERCISES
	// ─────────────────────────────────────────────

	async addExercise(userId: string, routineId: string, input: AddRoutineExerciseInput) {
		await this.findOne(userId, routineId);
		await this.exerciseService.findOneActive(userId, input.exercise_id);
		await this.assertExerciseNotInRoutine(routineId, input.exercise_id);

		const nextOrderIndex = await this.getNextOrderIndex(routineId);

		return this.prisma.routineExercise.create({
			data: {
				routine_id: routineId,
				exercise_id: input.exercise_id,
				target_sets: input.target_sets,
				target_reps_min: input.target_reps_min,
				target_reps_max: input.target_reps_max,
				target_rest_sec: input.target_rest_sec,
				order_index: nextOrderIndex,
				notes: input.notes ?? null,
			},
		});
	}

	async findAllExercises(userId: string, routineId: string) {
		await this.findOne(userId, routineId);

		return this.prisma.routineExercise.findMany({
			where: { routine_id: routineId },
			orderBy: { order_index: "asc" },
			include: {
				exercise: {
					select: {
						id: true,
						name: true,
						category: true,
						type: true,
						is_archived: true,
					},
				},
			},
		});
	}

	async updateExercise(
		userId: string,
		routineId: string,
		routineExerciseId: string,
		input: UpdateRoutineExerciseInput,
	) {
		await this.findOne(userId, routineId);
		const routineExercise = await this.findRoutineExercise(routineId, routineExerciseId);

		// If only one of the two rep fields is being updated, resolve the other
		// from the stored value to re-run the min <= max check correctly
		const newMin = input.target_reps_min ?? routineExercise.target_reps_min;
		const newMax = input.target_reps_max ?? routineExercise.target_reps_max;

		if (newMax < newMin) {
			throw new BadRequestException(
				"target_reps_max must be greater than or equal to target_reps_min",
			);
		}

		return this.prisma.routineExercise.update({
			where: { id: routineExerciseId },
			data: {
				...(input.target_sets !== undefined && { target_sets: input.target_sets }),
				...(input.target_reps_min !== undefined && { target_reps_min: input.target_reps_min }),
				...(input.target_reps_max !== undefined && { target_reps_max: input.target_reps_max }),
				...(input.target_rest_sec !== undefined && { target_rest_sec: input.target_rest_sec }),
				...(input.notes !== undefined && { notes: input.notes }),
			},
		});
	}

	async removeExercise(userId: string, routineId: string, routineExerciseId: string) {
		await this.findOne(userId, routineId);
		await this.findRoutineExercise(routineId, routineExerciseId);

		await this.prisma.routineExercise.delete({
			where: { id: routineExerciseId },
		});
	}

	async reorderExercises(userId: string, routineId: string, input: ReorderRoutineExercisesInput) {
		await this.findOne(userId, routineId);

		const existing = await this.prisma.routineExercise.findMany({
			where: { routine_id: routineId },
			select: { id: true },
		});

		const existingIds = new Set(existing.map((e) => e.id));
		const incomingIds = input.exercises.map((e) => e.id);

		const allBelong = incomingIds.every((id) => existingIds.has(id));
		if (!allBelong) {
			throw new BadRequestException("One or more exercise IDs do not belong to this routine");
		}

		// Update all order_index values in a single transaction
		await this.prisma.$transaction(
			input.exercises.map(({ id, order_index }) =>
				this.prisma.routineExercise.update({
					where: { id },
					data: { order_index },
				}),
			),
		);
	}

	// ─────────────────────────────────────────────
	// PRIVATE HELPERS
	// ─────────────────────────────────────────────

	private async assertUniqueNameForUser(userId: string, name: string, excludeId?: string) {
		const existing = await this.prisma.routine.findFirst({
			where: {
				user_id: userId,
				is_active: true,
				name: { equals: name, mode: "insensitive" },
				...(excludeId && { id: { not: excludeId } }),
			},
		});

		if (existing) {
			throw new ConflictException("You already have an active routine with this name");
		}
	}

	private async assertExerciseNotInRoutine(routineId: string, exerciseId: string) {
		const existing = await this.prisma.routineExercise.findFirst({
			where: { routine_id: routineId, exercise_id: exerciseId },
		});

		if (existing) {
			throw new ConflictException("This exercise is already in the routine");
		}
	}

	private async getNextOrderIndex(routineId: string): Promise<number> {
		const last = await this.prisma.routineExercise.findFirst({
			where: { routine_id: routineId },
			orderBy: { order_index: "desc" },
			select: { order_index: true },
		});

		return last ? last.order_index + 1 : 0;
	}

	private async findRoutineExercise(routineId: string, routineExerciseId: string) {
		const routineExercise = await this.prisma.routineExercise.findFirst({
			where: { id: routineExerciseId, routine_id: routineId },
		});

		if (!routineExercise) {
			throw new NotFoundException("Exercise not found in this routine");
		}

		return routineExercise;
	}
}
