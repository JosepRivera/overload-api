import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import type { AuthUser } from "@/jwt/types/jwt.types";
import type { CreateExerciseDto } from "./dto/create-exercise.dto";
import type { UpdateExerciseDto } from "./dto/update-exercise.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { ExerciseService } from "./exercise.service";

@Controller("exercise")
@UseGuards(JwtAuthGuard)
export class ExerciseController {
	constructor(private exerciseService: ExerciseService) {}

	@Post()
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
		return this.exerciseService.create(user.sub, dto);
	}

	@Get()
	async findAll(@CurrentUser() user: AuthUser, @Query("includeArchived") includeArchived?: string) {
		const include = includeArchived === "true";
		return this.exerciseService.findAll(user.sub, include);
	}

	@Get(":id")
	async findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
		return this.exerciseService.findOne(user.sub, id);
	}

	@Patch(":id")
	async update(
		@CurrentUser() user: AuthUser,
		@Param("id") id: string,
		@Body() dto: UpdateExerciseDto,
	) {
		return this.exerciseService.update(user.sub, id, dto);
	}

	@Patch(":id/archive")
	async archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
		return this.exerciseService.archive(user.sub, id);
	}
}
