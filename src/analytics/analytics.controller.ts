import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
	ApiBearerAuth,
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
// biome-ignore lint/style/useImportType: required for NestJS DI
import { AnalyticsService } from "./analytics.service.js";
import {
	Exercise1rmResponseDto,
	ExerciseProgressionResponseDto,
	ExercisePrsResponseDto,
	WorkoutVolumeResponseDto,
} from "./dto/analytics-response.dto.js";
import { type ProgressionQueryDto, progressionQuerySchema } from "./dto/progression-query.dto.js";

@ApiTags("analytics")
@ApiBearerAuth()
@ApiError(401, "Invalid or expired token")
@UseGuards(JwtAuthGuard)
@Controller("analytics")
export class AnalyticsController {
	constructor(private analyticsService: AnalyticsService) {}

	@Get("exercises/:exerciseId/prs")
	@ApiOperation({
		summary: "Get personal records for an exercise",
		description:
			"`weightPr` is the heaviest non-warmup set, `volumePr` the highest `weight x reps` " +
			"of a single set. Both are `null` when the exercise has no non-warmup sets.",
	})
	@ApiParam({ name: "exerciseId", format: "uuid", description: "Exercise ID" })
	@ApiOkResponse({ description: "Returns weight PR and volume PR", type: ExercisePrsResponseDto })
	@ApiValidationError("exerciseId must be a valid UUID", [uuidField("exerciseId")])
	@ApiError(404, "Exercise not found")
	async getExercisePrs(
		@CurrentUser() user: AuthUser,
		@Param("exerciseId", UuidPipe) exerciseId: string,
	) {
		return this.analyticsService.getExercisePrs(user.sub, exerciseId);
	}

	@Get("exercises/:exerciseId/1rm")
	@ApiOperation({
		summary: "Get estimated 1RM for an exercise",
		description:
			"Estimates one rep max using the Epley formula (`weight x (1 + reps / 30)`). " +
			"Only considers non-warmup sets with reps ≤ 10. Returns `null` if no eligible sets exist.",
	})
	@ApiParam({ name: "exerciseId", format: "uuid", description: "Exercise ID" })
	@ApiOkResponse({
		description:
			"Returns the estimated 1RM and the set it was based on, or null fields if no eligible sets exist",
		type: Exercise1rmResponseDto,
	})
	@ApiValidationError("exerciseId must be a valid UUID", [uuidField("exerciseId")])
	@ApiError(404, "Exercise not found")
	async getExercise1rm(
		@CurrentUser() user: AuthUser,
		@Param("exerciseId", UuidPipe) exerciseId: string,
	) {
		return this.analyticsService.getExercise1rm(user.sub, exerciseId);
	}

	@Get("exercises/:exerciseId/progression")
	@ApiOperation({
		summary: "Get historical progression for an exercise",
		description:
			"One entry per workout that contains non-warmup sets of this exercise, most recent first. " +
			"Returns an empty array when the exercise has never been trained.",
	})
	@ApiParam({ name: "exerciseId", format: "uuid", description: "Exercise ID" })
	@ApiOkResponse({
		description: "Returns session-by-session progression ordered by date desc",
		type: ExerciseProgressionResponseDto,
	})
	@ApiValidationError("Validation failed on limit, or exerciseId must be a valid UUID")
	@ApiError(404, "Exercise not found")
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Max sessions to return (default: 20, max: 100)",
	})
	async getExerciseProgression(
		@CurrentUser() user: AuthUser,
		@Param("exerciseId", UuidPipe) exerciseId: string,
		@Query(new ZodValidationPipe(progressionQuerySchema)) query: ProgressionQueryDto,
	) {
		return this.analyticsService.getExerciseProgression(user.sub, exerciseId, query);
	}

	@Get("workouts/:workoutId/volume")
	@ApiOperation({
		summary: "Get total volume for a workout",
		description: "Sums `weight x reps` across every non-warmup set in the workout.",
	})
	@ApiParam({ name: "workoutId", format: "uuid", description: "Workout ID" })
	@ApiOkResponse({
		description: "Returns total volume (weight x reps) for all non-warmup sets",
		type: WorkoutVolumeResponseDto,
	})
	@ApiValidationError("workoutId must be a valid UUID", [uuidField("workoutId")])
	@ApiError(404, "Workout not found")
	async getWorkoutVolume(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", UuidPipe) workoutId: string,
	) {
		return this.analyticsService.getWorkoutVolume(user.sub, workoutId);
	}
}
