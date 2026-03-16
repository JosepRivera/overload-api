import { Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterInput } from "./dto/create-user.dto";

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async createUser(input: RegisterInput) {
		const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

		return this.prisma.user.create({
			data: {
				email: input.email,
				name: input.name,
				password_hash: hashedPassword,
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

	async findById(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
		});
	}

	async findByIdSafe(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
		});

		if (!user) {
			throw new NotFoundException("User not found");
		}

		const { password_hash: _, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}
}
