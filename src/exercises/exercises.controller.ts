import {
	Body,
	Controller,
	Get,
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
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import type { AuthUser } from "@/jwt/types/jwt.types";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { ExerciseService } from "./exercises.service";

@ApiTags("exercises")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("exercises")
export class ExerciseController {
	constructor(private exerciseService: ExerciseService) {}

	@Post()
	@ApiOperation({ summary: "Create a new exercise" })
	@ApiBody({ type: CreateExerciseDto })
	@ApiCreatedResponse({ description: "Exercise created successfully" })
	@ApiConflictResponse({ description: "An exercise with this name already exists" })
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
		return this.exerciseService.create(user.sub, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all exercises for the current user" })
	@ApiOkResponse({ description: "Returns all exercises, optionally including archived ones" })
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
	@ApiOkResponse({ description: "Returns the exercise including archived ones" })
	@ApiNotFoundResponse({ description: "Exercise not found" })
	async findOne(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		return this.exerciseService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update an exercise name, category or type" })
	@ApiBody({ type: UpdateExerciseDto })
	@ApiOkResponse({ description: "Exercise updated successfully" })
	@ApiNotFoundResponse({ description: "Exercise not found" })
	@ApiConflictResponse({ description: "An exercise with this name already exists" })
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateExerciseDto,
	) {
		return this.exerciseService.update(user.sub, id, dto);
	}

	@Patch(":id/archive")
	@ApiOperation({ summary: "Archive an exercise (soft delete)" })
	@ApiOkResponse({ description: "Exercise archived successfully" })
	@ApiNotFoundResponse({ description: "Exercise not found" })
	async archive(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		return this.exerciseService.archive(user.sub, id);
	}
}
