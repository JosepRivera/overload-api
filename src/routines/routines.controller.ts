import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import type { AuthUser } from "@/jwt/types/jwt.types";
import type { CreateRoutineDto } from "./dto/create-routine.dto";
import type { UpdateRoutineDto } from "./dto/update-routine.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { RoutinesService } from "./routines.service";

@ApiTags("routines")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("routines")
export class RoutinesController {
	constructor(private routinesService: RoutinesService) {}

	@Post()
	@ApiOperation({ summary: "Create a new routine" })
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoutineDto) {
		return this.routinesService.create(user.sub, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all active routines for the current user" })
	@ApiOkResponse({ description: "Returns all active routines ordered by name" })
	async findAll(@CurrentUser() user: AuthUser) {
		return this.routinesService.findAll(user.sub);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single routine by ID" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
		return this.routinesService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a routine's name or description" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id") id: string,
		@Body() dto: UpdateRoutineDto,
	) {
		return this.routinesService.update(user.sub, id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({ summary: "Deactivate a routine (soft delete)" })
	@ApiNoContentResponse({ description: "Routine deactivated successfully" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
		await this.routinesService.deactivate(user.sub, id);
	}
}
