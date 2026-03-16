import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { RoutinesService } from "@/routines/routines.service";
import type { CreateWorkoutInput } from "./dto/create-workout.dto";
import type { UpdateWorkoutInput } from "./dto/update-workout.dto";

@Injectable()
export class WorkoutsService {
	constructor(
		private prisma: PrismaService,
		private routinesService: RoutinesService,
	) {}

	async create(userId: string, input: CreateWorkoutInput) {
		const activeWorkout = await this.prisma.workout.findFirst({
			where: {
				user_id: userId,
				finished_at: null,
			},
		});

		if (activeWorkout) {
			throw new ConflictException("You already have an active workout");
		}

		if (input.routine_id) {
			const routine = await this.routinesService.findOne(userId, input.routine_id);
			if (!routine.is_active) {
				throw new NotFoundException("Routine not found");
			}
		}

		return this.prisma.workout.create({
			data: {
				user_id: userId,
				started_at: input.started_at,
				notes: input.notes ?? null,
				...(input.routine_id && { routine_id: input.routine_id }),
			},
		});
	}

	async findAll(userId: string, page: number, limit: number) {
		const skip = (page - 1) * limit;

		const [workouts, total] = await Promise.all([
			this.prisma.workout.findMany({
				where: { user_id: userId, finished_at: { not: null } },
				orderBy: { started_at: "desc" },
				skip,
				take: limit,
			}),
			this.prisma.workout.count({
				where: { user_id: userId, finished_at: { not: null } },
			}),
		]);

		return { workouts, total, page, limit };
	}

	async findActive(userId: string) {
		return this.prisma.workout.findFirst({
			where: {
				user_id: userId,
				finished_at: null,
			},
		});
	}

	async findOne(userId: string, id: string) {
		const workout = await this.prisma.workout.findFirst({
			where: { id, user_id: userId },
		});

		if (!workout) {
			throw new NotFoundException("Workout not found");
		}

		return workout;
	}

	async update(userId: string, id: string, input: UpdateWorkoutInput) {
		await this.findOne(userId, id);

		return this.prisma.workout.update({
			where: { id },
			data: {
				...(input.notes !== undefined && { notes: input.notes }),
			},
		});
	}

	async finish(userId: string, id: string) {
		const workout = await this.findOne(userId, id);

		if (workout.finished_at !== null) {
			throw new BadRequestException("Workout is already finished");
		}

		this.validateWorkoutDuration(workout.started_at, new Date());

		return this.prisma.workout.update({
			where: { id },
			data: {
				finished_at: new Date(),
			},
		});
	}

	async remove(userId: string, id: string) {
		await this.findOne(userId, id);

		const setsCount = await this.prisma.set.count({
			where: { workout_id: id },
		});

		if (setsCount > 0) {
			throw new ConflictException("Cannot delete workout with associated sets");
		}

		await this.prisma.workout.delete({
			where: { id },
		});
	}

	private validateWorkoutDuration(startedAt: Date, finishedAt: Date) {
		const sixHoursMs = 6 * 60 * 60 * 1000;
		if (finishedAt.getTime() - startedAt.getTime() > sixHoursMs) {
			throw new BadRequestException("Workout duration cannot exceed 6 hours");
		}
	}
}
