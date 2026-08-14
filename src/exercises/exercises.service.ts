import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service.js";
import type { CreateExerciseInput } from "./dto/create-exercise.dto.js";
import type { UpdateExerciseInput } from "./dto/update-exercise.dto.js";

@Injectable()
export class ExerciseService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, input: CreateExerciseInput) {
		await this.assertUniqueNameForUser(userId, input.name);
		return this.prisma.exercise.create({
			data: {
				userId,
				name: input.name,
				category: input.category,
				type: input.type,
				notes: input.notes ?? null,
			},
			omit: { userId: true, createdAt: true, updatedAt: true },
		});
	}

	async findAll(userId: string, includeArchived = false) {
		return this.prisma.exercise.findMany({
			where: {
				userId,
				...(includeArchived ? {} : { isArchived: false }),
			},
			orderBy: [{ name: "asc" }],
			omit: { userId: true, createdAt: true, updatedAt: true },
		});
	}

	async findOne(userId: string, id: string) {
		const exercise = await this.prisma.exercise.findFirst({
			where: { id, userId },
			omit: { userId: true, createdAt: true, updatedAt: true },
		});
		if (!exercise) {
			throw new NotFoundException("Exercise not found");
		}
		return exercise;
	}

	async findOneActive(userId: string, id: string) {
		const exercise = await this.prisma.exercise.findFirst({
			where: { id, userId, isArchived: false },
		});
		if (!exercise) {
			throw new NotFoundException("Exercise not found or is archived");
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
			omit: { userId: true, createdAt: true, updatedAt: true },
		});
	}

	async archive(userId: string, id: string) {
		await this.findOne(userId, id);
		return this.prisma.exercise.update({
			where: { id },
			data: { isArchived: true },
			omit: { userId: true, createdAt: true, updatedAt: true },
		});
	}

	private async assertUniqueNameForUser(userId: string, name: string, excludeId?: string) {
		const existing = await this.prisma.exercise.findFirst({
			where: {
				userId,
				isArchived: false,
				name: { equals: name, mode: "insensitive" },
				...(excludeId && { id: { not: excludeId } }),
			},
		});
		if (existing) {
			throw new ConflictException("You already have an active exercise with this name");
		}
	}
}
