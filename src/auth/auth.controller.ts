import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
	ApiBody,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger";
import { ApiError, ApiValidationError } from "@/common/api-response.js";
import { RegisterDto } from "@/user/dto/create-user.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { AuthService } from "./auth.service.js";
import { AuthSessionResponseDto, AuthTokensResponseDto } from "./dto/auth-response.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	@ApiBody({ type: RegisterDto })
	@ApiCreatedResponse({
		description: "User registered successfully, tokens issued",
		type: AuthSessionResponseDto,
	})
	@ApiValidationError()
	@ApiError(409, "Email already in use")
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post("login")
	@HttpCode(200)
	@ApiOperation({ summary: "Login with email and password" })
	@ApiBody({ type: LoginDto })
	@ApiOkResponse({ description: "Login successful, tokens issued", type: AuthSessionResponseDto })
	@ApiValidationError()
	@ApiError(401, "Invalid credentials")
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Post("refresh")
	@HttpCode(200)
	@ApiOperation({
		summary: "Refresh access token using a valid refresh token",
		description:
			"Rotates the refresh token: the supplied token is revoked and a new token pair is issued. " +
			"The returned payload contains tokens only, no user object.",
	})
	@ApiBody({ type: RefreshTokenDto })
	@ApiOkResponse({ description: "New tokens issued", type: AuthTokensResponseDto })
	@ApiValidationError()
	@ApiError(401, "Invalid refresh token")
	async refresh(@Body() dto: RefreshTokenDto) {
		return this.authService.refresh(dto);
	}

	@Post("logout")
	@HttpCode(204)
	@ApiOperation({ summary: "Logout and revoke refresh token" })
	@ApiBody({ type: RefreshTokenDto })
	@ApiNoContentResponse({ description: "Logged out successfully. Empty response body." })
	@ApiValidationError()
	@ApiError(401, "Invalid refresh token")
	async logout(@Body() dto: RefreshTokenDto): Promise<void> {
		return this.authService.logout(dto);
	}
}
