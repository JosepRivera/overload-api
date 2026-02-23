import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { AuthUser } from "@/jwt/dto/jwt.types";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import { CreateExerciseDto, type CreateExerciseInput } from "./dto/create-exercise.dto";
import { UpdateExerciseDto, type UpdateExerciseInput } from "./dto/update-exercise.dto";
import { ExerciseService } from "./exercise.service";

@Controller("exercise")
@UseGuards(JwtAuthGuard)
export class ExerciseController {
	constructor(private exerciseService: ExerciseService) {}

	@Post()
	async create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
		const input: CreateExerciseInput = dto;
		return this.exerciseService.create(user.sub, input);
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
		const input: UpdateExerciseInput = dto;
		return this.exerciseService.update(user.sub, id, input);
	}

	@Patch(":id/archive")
	async archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
		return this.exerciseService.archive(user.sub, id);
	}
}
