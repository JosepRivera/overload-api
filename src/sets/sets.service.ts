import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service";
import type { CreateSetInput } from "./dto/create-set.dto";
import type { UpdateSetInput } from "./dto/update-set.dto";

@Injectable()
export class SetsService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, workoutId: string, dto: CreateSetInput) {
		const workout = await this.assertWorkoutAccess(userId, workoutId);

		if (workout.finished_at !== null) {
			throw new ConflictException("Cannot add sets to a finished workout");
		}

		const exercise = await this.prisma.exercise.findFirst({
			where: { id: dto.exercise_id, user_id: userId },
		});

		if (!exercise) {
			throw new NotFoundException("Exercise not found");
		}

		if (exercise.is_archived) {
			throw new ConflictException("Cannot log sets for an archived exercise");
		}

		const nextNumber = await this.getNextSetNumber(workoutId, dto.exercise_id);

		const set = await this.prisma.set.create({
			data: {
				workout_id: workoutId,
				exercise_id: dto.exercise_id,
				set_number: nextNumber,
				weight: dto.weight,
				reps: dto.reps,
				rpe: dto.rpe,
				is_warmup: dto.is_warmup,
			},
		});

		return set;
	}

	async findAll(userId: string, workoutId: string) {
		await this.assertWorkoutAccess(userId, workoutId);

		const sets = await this.prisma.set.findMany({
			where: { workout_id: workoutId },
			orderBy: [{ exercise_id: "asc" }, { set_number: "asc" }],
		});

		return sets;
	}

	async findOne(userId: string, workoutId: string, setId: string) {
		await this.assertWorkoutAccess(userId, workoutId);

		const set = await this.findSetOrThrow(workoutId, setId);

		return set;
	}

	async update(userId: string, workoutId: string, setId: string, dto: UpdateSetInput) {
		const workout = await this.assertWorkoutAccess(userId, workoutId);

		if (workout.finished_at !== null) {
			throw new ConflictException("Cannot modify sets of a finished workout");
		}

		await this.findSetOrThrow(workoutId, setId);

		const setUpdated = await this.prisma.set.update({
			where: { id: setId },
			data: dto,
		});

		return setUpdated;
	}

	async remove(userId: string, workoutId: string, setId: string) {
		const workout = await this.assertWorkoutAccess(userId, workoutId);

		if (workout.finished_at !== null) {
			throw new ConflictException("Cannot remove sets of a finished workout");
		}

		await this.findSetOrThrow(workoutId, setId);

		await this.prisma.set.delete({
			where: { id: setId },
		});
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

	private async findSetOrThrow(workoutId: string, setId: string) {
		const set = await this.prisma.set.findUnique({
			where: { id: setId, workout_id: workoutId },
		});

		if (!set) {
			throw new NotFoundException("Set not found");
		}

		return set;
	}

	private async getNextSetNumber(workoutId: string, exerciseId: string): Promise<number> {
		const last = await this.prisma.set.findFirst({
			where: { workout_id: workoutId, exercise_id: exerciseId },
			orderBy: { set_number: "desc" },
			select: { set_number: true },
		});
		return last ? last.set_number + 1 : 1;
	}
}
