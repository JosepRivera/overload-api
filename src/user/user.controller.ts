import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JWTPayload } from "jose";
import { CurrentUser } from "@/jwt/current-user.decorator";
import { JwtAuthGuard } from "@/jwt/jwt-auth.guard";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
	constructor(private userService: UserService) {}

	@UseGuards(JwtAuthGuard)
	@Get("me")
	async getCurrentUser(@CurrentUser() user: JWTPayload & { sub: string }) {
		return this.userService.findByIdSafe(user.sub);
	}

	@UseGuards(JwtAuthGuard)
	@Get(":id")
	async getUserById(@Param("id") id: string) {
		return this.userService.findByIdSafe(id);
	}
}
