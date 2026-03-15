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
	Query,
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
	ApiQuery,
	ApiTags,
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import type { AuthUser } from "@/jwt/types/jwt.types";
import { CreateWorkoutDto } from "./dto/create-workout.dto";
import { type ListWorkoutsDto, listWorkoutsSchema } from "./dto/list-workout.dto";
import { UpdateWorkoutDto } from "./dto/update-workout.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { WorkoutsService } from "./workouts.service";

@ApiTags("workouts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("workouts")
export class WorkoutsController {
	constructor(private workoutsService: WorkoutsService) {}

	@Post()
	@ApiOperation({ summary: "Start a new workout session" })
	@ApiBody({ type: CreateWorkoutDto })
	@ApiCreatedResponse({ description: "Workout created successfully" })
	@ApiConflictResponse({ description: "You already have an active workout" })
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkoutDto) {
		return this.workoutsService.create(user.sub, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all completed workouts for the current user" })
	@ApiOkResponse({ description: "Returns paginated completed workouts" })
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
	@ApiOperation({ summary: "Get the current active workout session" })
	@ApiOkResponse({ description: "Returns the active workout or null if none exists" })
	async findActive(@CurrentUser() user: AuthUser) {
		return this.workoutsService.findActive(user.sub);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single workout by ID" })
	@ApiOkResponse({ description: "Returns the workout" })
	@ApiNotFoundResponse({ description: "Workout not found" })
	async findOne(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		return this.workoutsService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update workout notes" })
	@ApiBody({ type: UpdateWorkoutDto })
	@ApiOkResponse({ description: "Workout updated successfully" })
	@ApiNotFoundResponse({ description: "Workout not found" })
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateWorkoutDto,
	) {
		return this.workoutsService.update(user.sub, id, dto);
	}

	@Post(":id/finish")
	@HttpCode(200)
	@ApiOperation({ summary: "Finish an active workout session" })
	@ApiOkResponse({ description: "Workout finished successfully" })
	@ApiNotFoundResponse({ description: "Workout not found" })
	@ApiConflictResponse({ description: "Workout is already finished" })
	async finish(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		return this.workoutsService.finish(user.sub, id);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({ summary: "Delete a workout without sets" })
	@ApiNoContentResponse({ description: "Workout deleted successfully" })
	@ApiNotFoundResponse({ description: "Workout not found" })
	@ApiConflictResponse({ description: "Cannot delete workout with associated sets" })
	async remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		await this.workoutsService.remove(user.sub, id);
	}
}
