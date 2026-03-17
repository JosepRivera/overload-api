import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import type { AuthUser } from "@/jwt/types/jwt.types";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { AnalyticsService } from "./analytics.service";
import { type ProgressionQueryDto, progressionQuerySchema } from "./dto/progression-query.dto";

@ApiTags("analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("analytics")
export class AnalyticsController {
	constructor(private analyticsService: AnalyticsService) {}

	@Get("exercises/:exerciseId/prs")
	@ApiOperation({ summary: "Get personal records for an exercise" })
	@ApiOkResponse({ description: "Returns weight PR and volume PR" })
	@ApiNotFoundResponse({ description: "Exercise not found" })
	async getExercisePrs(
		@CurrentUser() user: AuthUser,
		@Param("exerciseId", ParseUUIDPipe) exerciseId: string,
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
	@ApiOkResponse({
		description:
			"Returns the estimated 1RM and the set it was based on, or null fields if no eligible sets exist",
		schema: {
			example: {
				data: {
					exercise_id: "uuid",
					estimated_1rm: 112.5,
					based_on: { weight: 100, reps: 3 },
				},
			},
		},
	})
	@ApiNotFoundResponse({ description: "Exercise not found" })
	async getExercise1rm(
		@CurrentUser() user: AuthUser,
		@Param("exerciseId", ParseUUIDPipe) exerciseId: string,
	) {
		return this.analyticsService.getExercise1rm(user.sub, exerciseId);
	}

	@Get("exercises/:exerciseId/progression")
	@ApiOperation({ summary: "Get historical progression for an exercise" })
	@ApiOkResponse({ description: "Returns session-by-session progression ordered by date desc" })
	@ApiNotFoundResponse({ description: "Exercise not found" })
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Max sessions to return (default: 20, max: 100)",
	})
	async getExerciseProgression(
		@CurrentUser() user: AuthUser,
		@Param("exerciseId", ParseUUIDPipe) exerciseId: string,
		@Query(new ZodValidationPipe(progressionQuerySchema)) query: ProgressionQueryDto,
	) {
		return this.analyticsService.getExerciseProgression(user.sub, exerciseId, query);
	}

	@Get("workouts/:workoutId/volume")
	@ApiOperation({ summary: "Get total volume for a workout" })
	@ApiOkResponse({ description: "Returns total volume (weight x reps) for all non-warmup sets" })
	@ApiNotFoundResponse({ description: "Workout not found" })
	async getWorkoutVolume(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", ParseUUIDPipe) workoutId: string,
	) {
		return this.analyticsService.getWorkoutVolume(user.sub, workoutId);
	}
}
