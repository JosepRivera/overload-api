import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { RegisterDto } from "@/user/dto/create-user.dto";
import { AuthService } from "./auth.service";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { LogoutResponseDto } from "./dto/logout-response.dto";
import { RefreshResponseDto } from "./dto/refresh-response.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

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
