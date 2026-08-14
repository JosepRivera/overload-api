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
	ApiBody,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { ApiError, ApiValidationError, uuidField } from "@/common/api-response.js";
import { UuidPipe } from "@/common/uuid.pipe.js";
import { CurrentUser } from "@/jwt/current-user.decorator.js";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard.js";
import type { AuthUser } from "@/jwt/types/jwt.types.js";
import { AddRoutineExerciseDto } from "./dto/add-routine-exercise.dto.js";
import { CreateRoutineDto } from "./dto/create-routine.dto.js";
import { ReorderRoutineExercisesDto } from "./dto/reorder-routine-exercise.dto.js";
import {
	RoutineDetailResponseDto,
	RoutineExerciseListResponseDto,
	RoutineExerciseResponseDto,
	RoutineListResponseDto,
	RoutineResponseDto,
} from "./dto/routine-response.dto.js";
import { UpdateRoutineDto } from "./dto/update-routine.dto.js";
import { UpdateRoutineExerciseDto } from "./dto/update-routine-exercise.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { RoutinesService } from "./routines.service.js";

@ApiTags("routines")
@ApiBearerAuth()
@ApiError(401, "Invalid or expired token")
@UseGuards(JwtAuthGuard)
@Controller("routines")
export class RoutinesController {
	constructor(private routinesService: RoutinesService) {}

	@Post()
	@ApiOperation({ summary: "Create a new routine" })
	@ApiBody({ type: CreateRoutineDto })
	@ApiCreatedResponse({ description: "Routine created successfully", type: RoutineResponseDto })
	@ApiValidationError()
	@ApiError(409, "You already have an active routine with this name")
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoutineDto) {
		return this.routinesService.create(user.sub, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all active routines for the current user" })
	@ApiOkResponse({
		description: "Returns all active routines ordered by name, without their exercises",
		type: RoutineListResponseDto,
	})
	async findAll(@CurrentUser() user: AuthUser) {
		return this.routinesService.findAll(user.sub);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single routine with its exercises" })
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiOkResponse({
		description: "Returns the routine with exercises ordered by orderIndex",
		type: RoutineDetailResponseDto,
	})
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Routine not found")
	async findOne(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		return this.routinesService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({
		summary: "Update a routine name or description",
		description: "Returns the routine without its exercises.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiBody({ type: UpdateRoutineDto })
	@ApiOkResponse({ description: "Routine updated successfully", type: RoutineResponseDto })
	@ApiValidationError()
	@ApiError(404, "Routine not found")
	@ApiError(409, "You already have an active routine with this name")
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) id: string,
		@Body() dto: UpdateRoutineDto,
	) {
		return this.routinesService.update(user.sub, id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({
		summary: "Deactivate a routine (soft delete)",
		description: "Sets `isActive` to false. The routine stops appearing in the routine list.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiNoContentResponse({ description: "Routine deactivated successfully. Empty response body." })
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Routine not found")
	async deactivate(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		await this.routinesService.deactivate(user.sub, id);
	}

	@Post(":id/exercises")
	@ApiOperation({
		summary: "Add an exercise to a routine",
		description:
			"The new entry is appended at the end, so `orderIndex` is assigned automatically. " +
			"Returns the routine exercise alone, without the joined exercise.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiBody({ type: AddRoutineExerciseDto })
	@ApiCreatedResponse({
		description: "Exercise added to routine successfully",
		type: RoutineExerciseResponseDto,
	})
	@ApiValidationError()
	@ApiError(404, "Routine or exercise not found")
	@ApiError(409, "This exercise is already in the routine")
	async addExercise(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) routineId: string,
		@Body() dto: AddRoutineExerciseDto,
	) {
		return this.routinesService.addExercise(user.sub, routineId, dto);
	}

	@Get(":id/exercises")
	@ApiOperation({ summary: "List all exercises in a routine ordered by position" })
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiOkResponse({
		description: "Returns all exercises ordered by orderIndex, each with its exercise details",
		type: RoutineExerciseListResponseDto,
	})
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Routine not found")
	async findAllExercises(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) routineId: string) {
		return this.routinesService.findAllExercises(user.sub, routineId);
	}

	@Patch(":id/exercises/:exerciseId")
	@ApiOperation({
		summary: "Update exercise configuration within a routine",
		description:
			"`exerciseId` is the routine exercise ID returned when adding it, not the exercise ID.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiParam({ name: "exerciseId", format: "uuid", description: "Routine exercise ID" })
	@ApiBody({ type: UpdateRoutineExerciseDto })
	@ApiOkResponse({
		description: "Exercise configuration updated successfully",
		type: RoutineExerciseResponseDto,
	})
	@ApiValidationError("Validation failed, or targetRepsMax is lower than the stored targetRepsMin")
	@ApiError(404, "Exercise not found in this routine")
	async updateExercise(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) routineId: string,
		@Param("exerciseId", UuidPipe) exerciseId: string,
		@Body() dto: UpdateRoutineExerciseDto,
	) {
		return this.routinesService.updateExercise(user.sub, routineId, exerciseId, dto);
	}

	@Delete(":id/exercises/:exerciseId")
	@HttpCode(204)
	@ApiOperation({
		summary: "Remove an exercise from a routine",
		description:
			"`exerciseId` is the routine exercise ID returned when adding it, not the exercise ID.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiParam({ name: "exerciseId", format: "uuid", description: "Routine exercise ID" })
	@ApiNoContentResponse({
		description: "Exercise removed from routine successfully. Empty response body.",
	})
	@ApiValidationError("id or exerciseId must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Exercise not found in this routine")
	async removeExercise(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) routineId: string,
		@Param("exerciseId", UuidPipe) exerciseId: string,
	) {
		await this.routinesService.removeExercise(user.sub, routineId, exerciseId);
	}

	@Post(":id/exercises/reorder")
	@HttpCode(200)
	@ApiOperation({
		summary: "Reorder exercises within a routine",
		description:
			"Send every routine exercise ID with its new `orderIndex`. Indexes and IDs must both be unique. " +
			"Returns the routine exercises in their new order.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Routine ID" })
	@ApiBody({ type: ReorderRoutineExercisesDto })
	@ApiOkResponse({
		description: "Returns the routine exercises in their new order",
		type: RoutineExerciseListResponseDto,
	})
	@ApiValidationError(
		"Validation failed, or one or more exercise IDs do not belong to this routine",
	)
	@ApiError(404, "Routine not found")
	async reorderExercises(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) routineId: string,
		@Body() dto: ReorderRoutineExercisesDto,
	) {
		return this.routinesService.reorderExercises(user.sub, routineId, dto);
	}
}
