import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import type { RegisterDto } from "@/user/dto/create-user.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { AuthService } from "./auth.service";
import type { LoginDto } from "./dto/login.dto";
import type { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { AuthResponseDto } from "./interfaces/auth-response.interface";
import type { LogoutResponseDto } from "./interfaces/logout-response.interface";
import type { RefreshResponseDto } from "./interfaces/refresh-response.interface";

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("register")
	async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
		return this.authService.register(dto);
	}

	@Post("login")
	@HttpCode(200)
	async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
		return this.authService.login(dto);
	}

	@Post("refresh")
	@HttpCode(200)
	async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponseDto> {
		return this.authService.refresh(dto);
	}

	@Post("logout")
	@HttpCode(200)
	async logout(@Body() dto: RefreshTokenDto): Promise<LogoutResponseDto> {
		return this.authService.logout(dto);
	}
}
