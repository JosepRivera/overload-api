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
import { CreateSetDto } from "./dto/create-set.dto.js";
import { SetListResponseDto, SetResponseDto } from "./dto/set-response.dto.js";
import { UpdateSetDto } from "./dto/update-set.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { SetsService } from "./sets.service.js";

@ApiTags("sets")
@ApiBearerAuth()
@ApiError(401, "Invalid or expired token")
@ApiParam({ name: "workoutId", format: "uuid", description: "Workout the set belongs to" })
@UseGuards(JwtAuthGuard)
@Controller("workouts/:workoutId/sets")
export class SetsController {
	constructor(private setsService: SetsService) {}

	@Post()
	@ApiOperation({
		summary: "Log a new set in a workout",
		description: "`setNumber` is assigned automatically per exercise within the workout.",
	})
	@ApiBody({ type: CreateSetDto })
	@ApiCreatedResponse({ description: "Set logged successfully", type: SetResponseDto })
	@ApiValidationError()
	@ApiError(404, "Workout or exercise not found")
	@ApiError(409, "Cannot add sets to a finished workout")
	async create(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", UuidPipe) workoutId: string,
		@Body() dto: CreateSetDto,
	) {
		return this.setsService.create(user.sub, workoutId, dto);
	}

	@Get()
	@ApiOperation({ summary: "List all sets in a workout" })
	@ApiOkResponse({
		description: "Returns all sets ordered by exercise and set number",
		type: SetListResponseDto,
	})
	@ApiValidationError("workoutId must be a valid UUID", [uuidField("workoutId")])
	@ApiError(404, "Workout not found")
	async findAll(@CurrentUser() user: AuthUser, @Param("workoutId", UuidPipe) workoutId: string) {
		return this.setsService.findAll(user.sub, workoutId);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a single set by ID" })
	@ApiParam({ name: "id", format: "uuid", description: "Set ID" })
	@ApiOkResponse({ description: "Returns the set", type: SetResponseDto })
	@ApiValidationError("workoutId or id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Set not found")
	async findOne(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", UuidPipe) workoutId: string,
		@Param("id", UuidPipe) id: string,
	) {
		return this.setsService.findOne(user.sub, workoutId, id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a set" })
	@ApiParam({ name: "id", format: "uuid", description: "Set ID" })
	@ApiBody({ type: UpdateSetDto })
	@ApiOkResponse({ description: "Set updated successfully", type: SetResponseDto })
	@ApiValidationError()
	@ApiError(404, "Set not found")
	@ApiError(409, "Cannot modify sets of a finished workout")
	async update(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", UuidPipe) workoutId: string,
		@Param("id", UuidPipe) id: string,
		@Body() dto: UpdateSetDto,
	) {
		return this.setsService.update(user.sub, workoutId, id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@ApiOperation({ summary: "Delete a set" })
	@ApiParam({ name: "id", format: "uuid", description: "Set ID" })
	@ApiNoContentResponse({ description: "Set deleted successfully. Empty response body." })
	@ApiValidationError("workoutId or id must be a valid UUID", [uuidField("id")])
	@ApiError(404, "Set not found")
	@ApiError(409, "Cannot remove sets of a finished workout")
	async remove(
		@CurrentUser() user: AuthUser,
		@Param("workoutId", UuidPipe) workoutId: string,
		@Param("id", UuidPipe) id: string,
	) {
		await this.setsService.remove(user.sub, workoutId, id);
	}
}
