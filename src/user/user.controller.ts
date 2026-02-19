import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/types/jwt-payload.type";
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
