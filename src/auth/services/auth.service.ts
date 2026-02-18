import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env";
import { RegisterDto } from "@/user/dto/create-user.dto";
import { UserService } from "@/user/user.service";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "../dto/login.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { JwtService } from "./jwt.service";

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private userService: UserService,
	) {}

	private async validatePassword(password: string, hashedPassword: string) {
		const isValid = await bcrypt.compare(password, hashedPassword);
		return isValid;
	}

	private async saveRefreshToken(userId: string, token: string) {
		const tokenHash = await bcrypt.hash(token, env.BCRYPT_ROUNDS);

		await this.prisma.refreshToken.deleteMany({
			where: {
				user_id: userId,
				expires_at: { lt: new Date() },
			},
		});

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		return this.prisma.refreshToken.create({
			data: {
				user_id: userId,
				token_hash: tokenHash,
				expires_at: expiresAt,
			},
		});
	}

	private async generateTokens(userId: string, email: string) {
		const payload = { sub: userId, email };

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAccessToken(payload),
			this.jwtService.signRefreshToken(payload),
		]);

		return { accessToken, refreshToken };
	}

	async login(dto: LoginDto) {
		const user = await this.userService.findByEmail(dto.email);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const isPasswordValid = await this.validatePassword(dto.password, user.password);
		if (!isPasswordValid) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const tokens = await this.generateTokens(user.id, user.email);
		await this.saveRefreshToken(user.id, tokens.refreshToken);

		const { password: _, ...userData } = user;
		return { ...tokens, user: userData };
	}

	async register(dto: RegisterDto) {
		const existingUser = await this.userService.findByEmail(dto.email);

		if (existingUser) {
			throw new ConflictException("Email already in use");
		}

		const user = await this.userService.createUser(dto);
		const tokens = await this.generateTokens(user.id, user.email);
		await this.saveRefreshToken(user.id, tokens.refreshToken);

		const { password: _, ...userData } = user;
		return { ...tokens, user: userData };
	}

	async refresh(dto: RefreshTokenDto) {
		const result = await this.jwtService.verify(dto.refreshToken);
		if (!result.valid) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const tokenHash = await bcrypt.hash(dto.refreshToken, env.BCRYPT_ROUNDS);

		const storedToken = await this.prisma.refreshToken.findUnique({
			where: { token_hash: tokenHash },
			include: { user: true },
		});

		if (!storedToken || !storedToken.user || storedToken.revoked_at) {
			throw new UnauthorizedException("Refresh token revoked or not found");
		}

		if (storedToken.expires_at < new Date()) {
			throw new UnauthorizedException("Refresh token expired");
		}

		const tokens = await this.generateTokens(storedToken.user.id, storedToken.user.email);

		await this.prisma.refreshToken.update({
			where: { id: storedToken.id },
			data: { revoked_at: new Date() },
		});

		await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

		return tokens;
	}

	async logout(dto: RefreshTokenDto) {
		const result = await this.jwtService.verify(dto.refreshToken);

		if (!result.valid) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const tokenHash = await bcrypt.hash(dto.refreshToken, env.BCRYPT_ROUNDS);

		const storedToken = await this.prisma.refreshToken.findUnique({
			where: { token_hash: tokenHash },
		});

		if (storedToken) {
			await this.prisma.refreshToken.update({
				where: { id: storedToken.id },
				data: { revoked_at: new Date() },
			});
		}

		return { message: "Logged out successfully" };
	}
}
