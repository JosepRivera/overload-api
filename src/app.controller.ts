import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "./prisma/prisma.service.js";

@Controller("health")
export class AppController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async check() {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return { status: "ok" };
		} catch {
			throw new ServiceUnavailableException("Database unreachable");
		}
	}
}
