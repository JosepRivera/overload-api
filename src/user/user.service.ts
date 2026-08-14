import { Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "../prisma/prisma.service.js";
import type { RegisterInput } from "./dto/create-user.dto.js";

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async createUser(input: RegisterInput) {
		const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

		return this.prisma.user.create({
			data: {
				email: input.email,
				name: input.name,
				passwordHash: hashedPassword,
			},
		});
	}

	async findByEmail(email: string) {
		return this.prisma.user.findFirst({
			where: {
				email: { equals: email, mode: "insensitive" },
			},
		});
	}

	async findByIdSafe(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			omit: {
				passwordHash: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException("User not found");
		}

		return user;
	}
}
