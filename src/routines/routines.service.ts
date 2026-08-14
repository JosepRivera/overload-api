import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { ExerciseService } from "@/exercises/exercises.service.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service.js";
import type { AddRoutineExerciseInput } from "./dto/add-routine-exercise.dto.js";
import type { CreateRoutineInput } from "./dto/create-routine.dto.js";
import type { ReorderRoutineExercisesInput } from "./dto/reorder-routine-exercise.dto.js";
import type { UpdateRoutineInput } from "./dto/update-routine.dto.js";
import type { UpdateRoutineExerciseInput } from "./dto/update-routine-exercise.dto.js";

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
				userId,
				name: input.name,
				description: input.description ?? null,
			},
		});
	}

	async findAll(userId: string) {
		return this.prisma.routine.findMany({
			where: { userId, isActive: true },
			orderBy: { name: "asc" },
		});
	}

	async findOne(userId: string, id: string) {
		const routine = await this.prisma.routine.findFirst({
			where: { id, userId },
			include: {
				routineExercises: {
					orderBy: { orderIndex: "asc" },
					include: {
						exercise: {
							select: {
								id: true,
								name: true,
								category: true,
								type: true,
								isArchived: true,
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
		const routine = await this.findOne(userId, id);

		if (!routine.isActive) {
			throw new NotFoundException("Routine not found");
		}

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
		const routine = await this.findOne(userId, id);

		if (!routine.isActive) {
			throw new NotFoundException("Routine not found");
		}

		await this.prisma.routine.update({
			where: { id },
			data: { isActive: false },
		});
	}

	// ─────────────────────────────────────────────
	// ROUTINE EXERCISES
	// ─────────────────────────────────────────────

	async addExercise(userId: string, routineId: string, input: AddRoutineExerciseInput) {
		const routine = await this.findOne(userId, routineId);

		if (!routine.isActive) {
			throw new NotFoundException("Routine not found");
		}

		await this.exerciseService.findOneActive(userId, input.exerciseId);
		await this.assertExerciseNotInRoutine(routineId, input.exerciseId);

		const nextOrderIndex = await this.getNextOrderIndex(routineId);

		return this.prisma.routineExercise.create({
			data: {
				routineId,
				exerciseId: input.exerciseId,
				targetSets: input.targetSets,
				targetRepsMin: input.targetRepsMin,
				targetRepsMax: input.targetRepsMax,
				targetRestSec: input.targetRestSec,
				orderIndex: nextOrderIndex,
				notes: input.notes ?? null,
			},
		});
	}

	async findAllExercises(userId: string, routineId: string) {
		await this.findOne(userId, routineId);

		return this.prisma.routineExercise.findMany({
			where: { routineId },
			orderBy: { orderIndex: "asc" },
			include: {
				exercise: {
					select: {
						id: true,
						name: true,
						category: true,
						type: true,
						isArchived: true,
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
		const newMin = input.targetRepsMin ?? routineExercise.targetRepsMin;
		const newMax = input.targetRepsMax ?? routineExercise.targetRepsMax;

		if (newMax < newMin) {
			throw new BadRequestException("targetRepsMax must be greater than or equal to targetRepsMin");
		}

		return this.prisma.routineExercise.update({
			where: { id: routineExerciseId },
			data: {
				...(input.targetSets !== undefined && { targetSets: input.targetSets }),
				...(input.targetRepsMin !== undefined && { targetRepsMin: input.targetRepsMin }),
				...(input.targetRepsMax !== undefined && { targetRepsMax: input.targetRepsMax }),
				...(input.targetRestSec !== undefined && { targetRestSec: input.targetRestSec }),
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
			where: { routineId },
			select: { id: true },
		});

		const existingIds = new Set(existing.map((e) => e.id));
		const incomingIds = input.exercises.map((e) => e.id);

		const allBelong = incomingIds.every((id) => existingIds.has(id));
		if (!allBelong) {
			throw new BadRequestException("One or more exercise IDs do not belong to this routine");
		}

		// Paso 1: índices temporales negativos para evitar conflictos con unique constraint
		await this.prisma.$transaction(
			input.exercises.map(({ id }, i) =>
				this.prisma.routineExercise.update({
					where: { id },
					data: { orderIndex: -(i + 1) },
				}),
			),
		);

		// Paso 2: índices finales
		await this.prisma.$transaction(
			input.exercises.map(({ id, orderIndex }) =>
				this.prisma.routineExercise.update({
					where: { id },
					data: { orderIndex },
				}),
			),
		);

		return this.findAllExercises(userId, routineId);
	}

	// ─────────────────────────────────────────────
	// PRIVATE HELPERS
	// ─────────────────────────────────────────────

	private async assertUniqueNameForUser(userId: string, name: string, excludeId?: string) {
		const existing = await this.prisma.routine.findFirst({
			where: {
				userId,
				isActive: true,
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
			where: { routineId, exerciseId },
		});

		if (existing) {
			throw new ConflictException("This exercise is already in the routine");
		}
	}

	private async getNextOrderIndex(routineId: string): Promise<number> {
		const last = await this.prisma.routineExercise.findFirst({
			where: { routineId },
			orderBy: { orderIndex: "desc" },
			select: { orderIndex: true },
		});

		return last ? last.orderIndex + 1 : 0;
	}

	private async findRoutineExercise(routineId: string, routineExerciseId: string) {
		const routineExercise = await this.prisma.routineExercise.findFirst({
			where: { id: routineExerciseId, routineId },
		});

		if (!routineExercise) {
			throw new NotFoundException("Exercise not found in this routine");
		}

		return routineExercise;
	}
}
