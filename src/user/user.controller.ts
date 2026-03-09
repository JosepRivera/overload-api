import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger";
import type { JWTPayload } from "jose";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { UserService } from "./user.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UserController {
	constructor(private userService: UserService) {}

	@Get("me")
	@ApiOperation({ summary: "Get the current authenticated user" })
	@ApiOkResponse({ description: "Returns the current user without password" })
	async getCurrentUser(@CurrentUser() user: JWTPayload & { sub: string }) {
		return this.userService.findByIdSafe(user.sub);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a user by ID" })
	@ApiOkResponse({ description: "Returns the user without password" })
	@ApiNotFoundResponse({ description: "User not found" })
	async getUserById(@Param("id") id: string) {
		return this.userService.findByIdSafe(id);
	}
}
