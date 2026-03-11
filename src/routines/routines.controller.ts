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
import { AddRoutineExerciseDto } from "./dto/add-routine-exercise.dto";
import { CreateRoutineDto } from "./dto/create-routine.dto";
import { ReorderRoutineExercisesDto } from "./dto/reorder-routine-exercise.dto";
import { UpdateRoutineDto } from "./dto/update-routine.dto";
import { UpdateRoutineExerciseDto } from "./dto/update-routine-exercise.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { RoutinesService } from "./routines.service";

@ApiTags("routines")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("routines")
export class RoutinesController {
	constructor(private routinesService: RoutinesService) {}

	// ─────────────────────────────────────────────
	// ROUTINE CRUD
	// ─────────────────────────────────────────────

	@Post()
	@ApiOperation({ summary: "Create a new routine" })
	@ApiBody({ type: CreateRoutineDto })
	@ApiCreatedResponse({ description: "Routine created successfully" })
	@ApiConflictResponse({ description: "A routine with this name already exists" })
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
	@ApiOperation({ summary: "Get a single routine with its exercises" })
	@ApiOkResponse({ description: "Returns the routine with exercises ordered by order_index" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async findOne(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		return this.routinesService.findOne(user.sub, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a routine name or description" })
	@ApiBody({ type: UpdateRoutineDto })
	@ApiOkResponse({ description: "Routine updated successfully" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	@ApiConflictResponse({ description: "A routine with this name already exists" })
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateRoutineDto,
	) {
		return this.routinesService.update(user.sub, id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({ summary: "Deactivate a routine (soft delete)" })
	@ApiNoContentResponse({ description: "Routine deactivated successfully" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async deactivate(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
		await this.routinesService.deactivate(user.sub, id);
	}

	// ─────────────────────────────────────────────
	// ROUTINE EXERCISES
	// ─────────────────────────────────────────────

	@Post(":id/exercises")
	@ApiOperation({ summary: "Add an exercise to a routine" })
	@ApiBody({ type: AddRoutineExerciseDto })
	@ApiCreatedResponse({ description: "Exercise added to routine successfully" })
	@ApiNotFoundResponse({ description: "Routine or exercise not found" })
	@ApiConflictResponse({ description: "Exercise is already in this routine" })
	async addExercise(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) routineId: string,
		@Body() dto: AddRoutineExerciseDto,
	) {
		return this.routinesService.addExercise(user.sub, routineId, dto);
	}

	@Get(":id/exercises")
	@ApiOperation({ summary: "List all exercises in a routine ordered by position" })
	@ApiOkResponse({ description: "Returns all exercises ordered by order_index" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async findAllExercises(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) routineId: string,
	) {
		return this.routinesService.findAllExercises(user.sub, routineId);
	}

	@Patch(":id/exercises/:exerciseId")
	@ApiOperation({ summary: "Update exercise configuration within a routine" })
	@ApiBody({ type: UpdateRoutineExerciseDto })
	@ApiOkResponse({ description: "Exercise configuration updated successfully" })
	@ApiNotFoundResponse({ description: "Routine or exercise not found" })
	async updateExercise(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) routineId: string,
		@Param("exerciseId", ParseUUIDPipe) exerciseId: string,
		@Body() dto: UpdateRoutineExerciseDto,
	) {
		return this.routinesService.updateExercise(user.sub, routineId, exerciseId, dto);
	}

	@Delete(":id/exercises/:exerciseId")
	@HttpCode(204)
	@ApiOperation({ summary: "Remove an exercise from a routine" })
	@ApiNoContentResponse({ description: "Exercise removed from routine successfully" })
	@ApiNotFoundResponse({ description: "Routine or exercise not found" })
	async removeExercise(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) routineId: string,
		@Param("exerciseId", ParseUUIDPipe) exerciseId: string,
	) {
		await this.routinesService.removeExercise(user.sub, routineId, exerciseId);
	}

	@Post(":id/exercises/reorder")
	@HttpCode(200)
	@ApiOperation({ summary: "Reorder exercises within a routine" })
	@ApiBody({ type: ReorderRoutineExercisesDto })
	@ApiOkResponse({ description: "Exercises reordered successfully" })
	@ApiNotFoundResponse({ description: "Routine not found" })
	async reorderExercises(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) routineId: string,
		@Body() dto: ReorderRoutineExercisesDto,
	) {
		await this.routinesService.reorderExercises(user.sub, routineId, dto);
	}
}
