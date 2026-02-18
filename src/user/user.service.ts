import { Injectable } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterInput } from "./dto/create-user.dto";

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async createUser(input: RegisterInput) {
		const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

		return this.prisma.user.create({
			data: {
				email: input.email,
				name: input.name,
				password: hashedPassword,
			},
		});
	}

	async findByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: { email },
		});
	}

	async findById(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
		});
	}
}
