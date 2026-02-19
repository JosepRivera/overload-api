import { Body, Controller, Post } from "@nestjs/common";
import { RegisterDto } from "@/user/dto/create-user.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { LogoutResponseDto } from "./dto/logout-responde.dto";
import { RefreshResponseDto } from "./dto/refresh-response.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthService } from "./services/auth.service";

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("register")
	async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
		return this.authService.register(dto);
	}

	@Post("login")
	async login(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
		return this.authService.login(dto);
	}

	@Post("refresh")
	async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponseDto> {
		return this.authService.refresh(dto);
	}

	@Post("logout")
	async logout(@Body() dto: RefreshTokenDto): Promise<LogoutResponseDto> {
		return this.authService.logout(dto);
	}
}
