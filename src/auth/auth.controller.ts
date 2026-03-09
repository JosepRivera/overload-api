import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RegisterDto } from "@/user/dto/create-user.dto";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	@ApiBody({ type: RegisterDto })
	@ApiCreatedResponse({ description: "User registered successfully, tokens issued" })
	@ApiConflictResponse({ description: "Email already in use" })
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post("login")
	@HttpCode(200)
	@ApiOperation({ summary: "Login with email and password" })
	@ApiBody({ type: LoginDto })
	@ApiOkResponse({ description: "Login successful, tokens issued" })
	@ApiUnauthorizedResponse({ description: "Invalid credentials" })
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Post("refresh")
	@HttpCode(200)
	@ApiOperation({ summary: "Refresh access token using a valid refresh token" })
	@ApiBody({ type: RefreshTokenDto })
	@ApiOkResponse({ description: "New tokens issued" })
	@ApiUnauthorizedResponse({ description: "Invalid or expired refresh token" })
	async refresh(@Body() dto: RefreshTokenDto) {
		return this.authService.refresh(dto);
	}

	@Post("logout")
	@HttpCode(200)
	@ApiOperation({ summary: "Logout and revoke refresh token" })
	@ApiBody({ type: RefreshTokenDto })
	@ApiOkResponse({ description: "Logged out successfully" })
	@ApiUnauthorizedResponse({ description: "Invalid refresh token" })
	async logout(@Body() dto: RefreshTokenDto) {
		return this.authService.logout(dto);
	}
}
