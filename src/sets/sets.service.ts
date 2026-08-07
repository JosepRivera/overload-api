import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { PrismaSet } from "@/prisma/prisma.service.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service.js";
import type { CreateSetInput } from "./dto/create-set.dto.js";
import type { UpdateSetInput } from "./dto/update-set.dto.js";

@Injectable()
export class SetsService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, workoutId: string, dto: CreateSetInput) {
		const workout = await this.assertWorkoutAccess(userId, workoutId);

		if (workout.finishedAt !== null) {
			throw new ConflictException("Cannot add sets to a finished workout");
		}

		const exercise = await this.prisma.exercise.findFirst({
			where: { id: dto.exerciseId, userId },
		});

		if (!exercise) {
			throw new NotFoundException("Exercise not found");
		}

		if (exercise.isArchived) {
			throw new ConflictException("Cannot log sets for an archived exercise");
		}

		const nextNumber = await this.getNextSetNumber(workoutId, dto.exerciseId);

		const set = await this.prisma.set.create({
			data: {
				workoutId,
				exerciseId: dto.exerciseId,
				setNumber: nextNumber,
				weight: dto.weight,
				reps: dto.reps,
				rpe: dto.rpe,
				isWarmup: dto.isWarmup,
			},
		});

		return this.serializeSet(set);
	}

	async findAll(userId: string, workoutId: string) {
		await this.assertWorkoutAccess(userId, workoutId);

		const sets = await this.prisma.set.findMany({
			where: { workoutId },
			orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
		});

		return sets.map((s) => this.serializeSet(s));
	}

	async findOne(userId: string, workoutId: string, setId: string) {
		await this.assertWorkoutAccess(userId, workoutId);

		const set = await this.findSetOrThrow(workoutId, setId);

		return this.serializeSet(set);
	}

	async update(userId: string, workoutId: string, setId: string, dto: UpdateSetInput) {
		const workout = await this.assertWorkoutAccess(userId, workoutId);

		if (workout.finishedAt !== null) {
			throw new ConflictException("Cannot modify sets of a finished workout");
		}

		await this.findSetOrThrow(workoutId, setId);

		const setUpdated = await this.prisma.set.update({
			where: { id: setId },
			data: dto,
		});

		return this.serializeSet(setUpdated);
	}

	async remove(userId: string, workoutId: string, setId: string) {
		const workout = await this.assertWorkoutAccess(userId, workoutId);

		if (workout.finishedAt !== null) {
			throw new ConflictException("Cannot remove sets of a finished workout");
		}

		await this.findSetOrThrow(workoutId, setId);

		await this.prisma.set.delete({
			where: { id: setId },
		});
	}

	private serializeSet(set: PrismaSet) {
		return {
			...set,
			weight: Number(set.weight),
			rpe: set.rpe !== null ? Number(set.rpe) : null,
		};
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

	private async findSetOrThrow(workoutId: string, setId: string) {
		const set = await this.prisma.set.findUnique({
			where: { id: setId, workoutId },
		});

		if (!set) {
			throw new NotFoundException("Set not found");
		}

		return set;
	}

	private async getNextSetNumber(workoutId: string, exerciseId: string): Promise<number> {
		const last = await this.prisma.set.findFirst({
			where: { workoutId, exerciseId },
			orderBy: { setNumber: "desc" },
			select: { setNumber: true },
		});
		return last ? last.setNumber + 1 : 1;
	}
}
