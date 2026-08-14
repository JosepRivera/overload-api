import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Query,
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
	ApiQuery,
	ApiTags,
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { ApiError, ApiValidationError, uuidField } from "@/common/api-response.js";
import { UuidPipe } from "@/common/uuid.pipe.js";
import { CurrentUser } from "@/jwt/current-user.decorator.js";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard.js";
import type { AuthUser } from "@/jwt/types/jwt.types.js";
import { CreateWorkoutDto } from "./dto/create-workout.dto.js";
import { type ListWorkoutsDto, listWorkoutsSchema } from "./dto/list-workout.dto.js";
import { UpdateWorkoutDto } from "./dto/update-workout.dto.js";
import {
	ActiveWorkoutResponseDto,
	WorkoutListResponseDto,
	WorkoutResponseDto,
} from "./dto/workout-response.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { WorkoutsService } from "./workouts.service.js";

@ApiTags("workouts")
@ApiBearerAuth()
@ApiError(401, "Invalid or expired token")
@UseGuards(JwtAuthGuard)
@Controller("workouts")
export class WorkoutsController {
	constructor(private workoutsService: WorkoutsService) {}

	@Post()
	@ApiOperation({
		summary: "Start a new workout session",
		description: "Only one unfinished workout may exist at a time.",
	})
	@ApiBody({ type: CreateWorkoutDto })
	@ApiCreatedResponse({ description: "Workout created successfully", type: WorkoutResponseDto })
	@ApiValidationError("Validation failed, or startedAt is in the future")
	@ApiError(404, "Routine not found")
	@ApiError(409, "You already have an active workout")
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkoutDto) {
		return this.workoutsService.create(user.sub, dto);
	}

	@Get()
	@ApiOperation({
		summary: "List all completed workouts for the current user",
		description: "Only finished workouts are listed, most recent first.",
	})
	@ApiOkResponse({
		description: "Returns paginated completed workouts",
		type: WorkoutListResponseDto,
	})
	@ApiValidationError("Validation failed on page or limit")
	@ApiQuery({
		name: "page",
		required: false,
		type: Number,
		description: "Page number (default: 1)",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Items per page (default: 20, max: 100)",
	})
	async findAll(
		@CurrentUser() user: AuthUser,
		@Query(new ZodValidationPipe(listWorkoutsSchema)) query: ListWorkoutsDto,
	) {
		return this.workoutsService.findAll(user.sub, query.page, query.limit);
	}

	@Get("active")
	@ApiOperation({
		summary: "Get the current active workout session",
		description: "`data` is null when there is no unfinished workout.",
	})
	@ApiOkResponse({
		description: "Returns the active workout, or null if there is none",
		type: ActiveWorkoutResponseDto,
	})
	async findActive(@CurrentUser() user: AuthUser) {
		return this.workoutsService.findActive(user.sub);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single workout by ID" })
	@ApiParam({ name: "id", format: "uuid", description: "Workout ID" })
	@ApiOkResponse({ description: "Returns the workout", type: WorkoutResponseDto })
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Workout not found")
	async findOne(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		return this.workoutsService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update workout notes" })
	@ApiParam({ name: "id", format: "uuid", description: "Workout ID" })
	@ApiBody({ type: UpdateWorkoutDto })
	@ApiOkResponse({ description: "Workout updated successfully", type: WorkoutResponseDto })
	@ApiValidationError()
	@ApiError(404, "Workout not found")
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id", UuidPipe) id: string,
		@Body() dto: UpdateWorkoutDto,
	) {
		return this.workoutsService.update(user.sub, id, dto);
	}

	@Post(":id/finish")
	@HttpCode(200)
	@ApiOperation({
		summary: "Finish an active workout session",
		description: "Stamps `finishedAt` with the current time. A session may not exceed 6 hours.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Workout ID" })
	@ApiOkResponse({ description: "Workout finished successfully", type: WorkoutResponseDto })
	@ApiError(400, "Workout duration cannot exceed 6 hours")
	@ApiError(404, "Workout not found")
	@ApiError(409, "Workout is already finished")
	async finish(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		return this.workoutsService.finish(user.sub, id);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({
		summary: "Delete a workout without sets",
		description: "Hard delete. Only possible while the workout has no logged sets.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "Workout ID" })
	@ApiNoContentResponse({ description: "Workout deleted successfully. Empty response body." })
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Workout not found")
	@ApiError(409, "Cannot delete workout with associated sets")
	async remove(@CurrentUser() user: AuthUser, @Param("id", UuidPipe) id: string) {
		await this.workoutsService.remove(user.sub, id);
	}
}
