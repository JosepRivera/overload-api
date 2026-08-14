import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from "@nestjs/swagger";
import { ApiError, ApiValidationError, uuidField } from "@/common/api-response.js";
import { UuidPipe } from "@/common/uuid.pipe.js";
import { CurrentUser } from "@/jwt/current-user.decorator.js";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard.js";
import type { AuthUser } from "@/jwt/types/jwt.types.js";
import { CreateExerciseDto } from "./dto/create-exercise.dto.js";
import { ExerciseListResponseDto, ExerciseResponseDto } from "./dto/exercise-response.dto.js";
import { UpdateExerciseDto } from "./dto/update-exercise.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { ExerciseService } from "./exercises.service.js";

@ApiTags("exercises")
@ApiBearerAuth()
@ApiError(401, "Invalid or expired token")
@UseGuards(JwtAuthGuard)
@Controller("exercises")
export class ExerciseController {
	constructor(private exerciseService: ExerciseService) {}

	@Post()
	@ApiOperation({ summary: "Create a new exercise" })
	@ApiBody({ type: CreateExerciseDto })
	@ApiCreatedResponse({ description: "Exercise created successfully", type: ExerciseResponseDto })
	@ApiValidationError()
	@ApiError(409, "You already have an active exercise with this name")
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
		return this.exerciseService.create(user.sub, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all exercises for the current user" })
	@ApiOkResponse({
		description: "Returns all exercises, optionally including archived ones",
		type: ExerciseListResponseDto,
	})
	@ApiQuery({
		name: "includeArchived",
		required: false,
		type: String,
		enum: ["true", "false"],
		description: "Pass true to include archived exercises in the response",
	})
	async findAll(@CurrentUser() user: AuthUser, @Query("includeArchived") includeArchived?: string) {
		const include = includeArchived === "true";
		return this.exerciseService.findAll(user.sub, include);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single exercise by ID" })
	@ApiParam({ name: "id", format: "uuid", description: "Exercise ID" })
	@ApiOkResponse({
		description: "Returns the exercise including archived ones",
		type: ExerciseResponseDto,
	})
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Exercise not found")
	async findOne(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		return this.exerciseService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update an exercise name, category or type" })
	@ApiParam({ name: "id", format: "uuid", description: "Exercise ID" })
	@ApiBody({ type: UpdateExerciseDto })
	@ApiOkResponse({ description: "Exercise updated successfully", type: ExerciseResponseDto })
	@ApiValidationError()
	@ApiError(404, "Exercise not found")
	@ApiError(409, "You already have an active exercise with this name")
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) id: string,
		@Body() dto: UpdateExerciseDto,
	) {
		return this.exerciseService.update(user.sub, id, dto);
	}

	@Patch(":id/archive")
	@ApiOperation({
		summary: "Archive an exercise (soft delete)",
		description: "Returns the archived exercise with `isArchived` set to true.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Exercise ID" })
	@ApiOkResponse({ description: "Exercise archived successfully", type: ExerciseResponseDto })
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Exercise not found")
	async archive(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		return this.exerciseService.archive(user.sub, id);
	}
}
