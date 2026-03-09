import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "@/prisma/prisma.service";
import type { CreateRoutineInput } from "./dto/create-routine.dto";
import type { UpdateRoutineInput } from "./dto/update-routine.dto";

@Injectable()
export class RoutinesService {
	constructor(private prisma: PrismaService) {}

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
			where: {
				user_id: userId,
				is_active: true,
			},
			orderBy: { name: "asc" },
		});
	}

	async findOne(userId: string, id: string) {
		const routine = await this.prisma.routine.findFirst({
			where: { id, user_id: userId },
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
}
