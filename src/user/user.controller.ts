// src/user/user.controller.ts
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/dto/jwt-payload.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
	constructor(private userService: UserService) {}

	@UseGuards(JwtAuthGuard)
	@Get("me")
	async getCurrentUser(@CurrentUser() user: JwtPayload) {
		return this.userService.findByIdSafe(user.sub);
	}

	@UseGuards(JwtAuthGuard)
	@Get(":id")
	async getUserById(@Param("id") id: string) {
		return this.userService.findByIdSafe(id);
	}
}
