import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { ApiError, envelope } from "./common/api-response.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "./prisma/prisma.service.js";

class HealthResponseDto extends createZodDto(envelope(z.object({ status: z.literal("ok") }))) {}

@ApiTags("health")
@Controller("health")
export class AppController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	@ApiOperation({
		summary: "Check API and database availability",
		description: "Runs a `SELECT 1` against the database. No authentication required.",
	})
	@ApiOkResponse({ description: "API and database are reachable", type: HealthResponseDto })
	@ApiError(503, "Database unreachable")
	async check() {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return { status: "ok" };
		} catch {
			throw new ServiceUnavailableException("Database unreachable");
		}
	}
}
