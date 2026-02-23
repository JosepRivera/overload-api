import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { CreateExerciseInput } from "./dto/create-exercise.dto";
import type { UpdateExerciseInput } from "./dto/update-exercise.dto";

@Injectable()
export class ExerciseService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, input: CreateExerciseInput) {
		await this.assertUniqueNameForUser(userId, input.name);
		return this.prisma.exercise.create({
			data: {
				user_id: userId,
				name: input.name,
				category: input.category,
				type: input.type,
				notes: input.notes ?? null,
			},
		});
	}

	async findAll(userId: string, includeArchived = false) {
		return this.prisma.exercise.findMany({
			where: {
				user_id: userId,
				...(includeArchived ? {} : { is_archived: false }),
			},
			orderBy: [{ name: "asc" }],
		});
	}

	async findOne(userId: string, id: string) {
		const exercise = await this.prisma.exercise.findFirst({
			where: { id, user_id: userId },
		});
		if (!exercise) {
			throw new NotFoundException("Exercise not found");
		}
		return exercise;
	}

	async update(userId: string, id: string, input: UpdateExerciseInput) {
		await this.findOne(userId, id);
		if (input.name !== undefined) {
			await this.assertUniqueNameForUser(userId, input.name, id);
		}
		return this.prisma.exercise.update({
			where: { id },
			data: {
				...(input.name !== undefined && { name: input.name }),
				...(input.category !== undefined && { category: input.category }),
				...(input.type !== undefined && { type: input.type }),
				...(input.notes !== undefined && { notes: input.notes }),
			},
		});
	}

	async archive(userId: string, id: string) {
		await this.findOne(userId, id);
		return this.prisma.exercise.update({
			where: { id },
			data: { is_archived: true },
		});
	}

	private async assertUniqueNameForUser(userId: string, name: string, excludeId?: string) {
		const existing = await this.prisma.exercise.findFirst({
			where: {
				user_id: userId,
				is_archived: false,
				name: { equals: name, mode: "insensitive" },
				...(excludeId && { id: { not: excludeId } }),
			},
		});
		if (existing) {
			throw new ConflictException("You already have an active exercise with this name");
		}
	}
}
