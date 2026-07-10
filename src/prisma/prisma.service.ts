import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

export type {
	Exercise as PrismaExercise,
	RefreshToken as PrismaRefreshToken,
	Routine as PrismaRoutine,
	Set as PrismaSet,
	User as PrismaUser,
	Workout as PrismaWorkout,
} from "../generated/prisma/client.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	constructor() {
		const adapter = new PrismaPg({
			connectionString: env.DATABASE_URL,
		});

		super({ adapter });
	}

	async onModuleInit() {
		await this.$connect();
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}
}
