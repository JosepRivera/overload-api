import { Controller, ForbiddenException, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { JWTPayload } from "jose";
import { ApiError, ApiValidationError, uuidField } from "@/common/api-response.js";
import { UuidPipe } from "@/common/uuid.pipe.js";
import { CurrentUser } from "@/jwt/current-user.decorator.js";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard.js";
import { UserResponseDto } from "./dto/user-response.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { UserService } from "./user.service.js";

@ApiTags("users")
@ApiBearerAuth()
@ApiError(401, "Invalid or expired token")
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UserController {
	constructor(private userService: UserService) {}

	@Get("me")
	@ApiOperation({ summary: "Get the current authenticated user" })
	@ApiOkResponse({
		description: "Returns the current user without password",
		type: UserResponseDto,
	})
	@ApiError(404, "User not found")
	async getCurrentUser(@CurrentUser() user: JWTPayload & { sub: string }) {
		return this.userService.findByIdSafe(user.sub);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get a user by ID",
		description: "Only your own ID is accessible; any other ID is rejected with 403.",
	})
	@ApiParam({ name: "id", format: "uuid", description: "User ID (must match the caller)" })
	@ApiOkResponse({ description: "Returns the user without password", type: UserResponseDto })
	@ApiValidationError("id must be a valid UUID", [uuidField("id")])
	@ApiError(403, "Cannot access another user's profile")
	@ApiError(404, "User not found")
	async getUserById(
		@CurrentUser() currentUser: JWTPayload & { sub: string },
		@Param("id", UuidPipe) id: string,
	) {
		if (currentUser.sub !== id) {
			throw new ForbiddenException("Cannot access another user's profile");
		}
		return this.userService.findByIdSafe(id);
	}
}
