import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import type { AuthUser } from "@/jwt/types/jwt.types";
import { CreateSetDto } from "./dto/create-set.dto";
import { UpdateSetDto } from "./dto/update-set.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { SetsService } from "./sets.service";

@ApiTags("sets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("workouts/:workoutId/sets")
export class SetsController {
	constructor(private setsService: SetsService) {}

	@Post()
	@ApiOperation({ summary: "Log a new set in a workout" })
	@ApiBody({ type: CreateSetDto })
	@ApiCreatedResponse({ description: "Set logged successfully" })
	@ApiNotFoundResponse({ description: "Workout or exercise not found" })
	@ApiConflictResponse({ description: "Workout is finished or exercise is archived" })
	async create(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", ParseUUIDPipe) workoutId: string,
		@Body() dto: CreateSetDto,
	) {
		return this.setsService.create(user.sub, workoutId, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all sets in a workout" })
	@ApiOkResponse({ description: "Returns all sets ordered by exercise and set number" })
	@ApiNotFoundResponse({ description: "Workout not found" })
	async findAll(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", ParseUUIDPipe) workoutId: string,
	) {
		return this.setsService.findAll(user.sub, workoutId);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single set by ID" })
	@ApiOkResponse({ description: "Returns the set" })
	@ApiNotFoundResponse({ description: "Workout or set not found" })
	async findOne(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", ParseUUIDPipe) workoutId: string,
		@Param("id", ParseUUIDPipe) id: string,
	) {
		return this.setsService.findOne(user.sub, workoutId, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a set" })
	@ApiBody({ type: UpdateSetDto })
	@ApiOkResponse({ description: "Set updated successfully" })
	@ApiNotFoundResponse({ description: "Workout or set not found" })
	@ApiConflictResponse({ description: "Cannot modify sets of a finished workout" })
	async update(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", ParseUUIDPipe) workoutId: string,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateSetDto,
	) {
		return this.setsService.update(user.sub, workoutId, id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({ summary: "Delete a set" })
	@ApiNoContentResponse({ description: "Set deleted successfully" })
	@ApiNotFoundResponse({ description: "Workout or set not found" })
	@ApiConflictResponse({ description: "Cannot delete sets of a finished workout" })
	async remove(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", ParseUUIDPipe) workoutId: string,
		@Param("id", ParseUUIDPipe) id: string,
	) {
		await this.setsService.remove(user.sub, workoutId, id);
	}
}