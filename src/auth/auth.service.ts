import { createHash, randomUUID } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { JwtService } from "@/jwt/jwt.service.js";
import type { RegisterDto } from "@/user/dto/create-user.dto.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { UserService } from "@/user/user.service.js";
// biome-ignore lint/style/useImportType: required for NestJS DI
import { PrismaService } from "../prisma/prisma.service.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RefreshTokenDto } from "./dto/refresh-token.dto.js";

const MAX_ACTIVE_REFRESH_TOKENS = 5;

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private userService: UserService,
	) {}

	private async validatePassword(password: string, hashedPassword: string) {
		return bcrypt.compare(password, hashedPassword);
	}

	private calculateExpiry(ttl: string): Date {
		const match = ttl.match(/^(\d+)\s*(ms|s|m|h|d|w|y)$/i);
		if (!match) {
			return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		}

		const value = Number.parseInt(match[1] ?? "0", 10);
		const unit = match[2]?.toLowerCase();

		const multipliers: Record<string, number> = {
			ms: 1,
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
			w: 7 * 24 * 60 * 60 * 1000,
			y: 365 * 24 * 60 * 60 * 1000,
		};

		return new Date(Date.now() + value * (multipliers[unit ?? ""] ?? 0));
	}

	private hashToken(token: string): string {
		return createHash("sha256").update(token).digest("hex");
	}

	private async saveRefreshToken(userId: string, token: string) {
		const tokenHash = this.hashToken(token);

		await this.prisma.refreshToken.deleteMany({
			where: {
				userId,
				expiresAt: { lt: new Date() },
			},
		});

		const activeTokens = await this.prisma.refreshToken.findMany({
			where: {
				userId,
				revokedAt: null,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: "asc" },
		});

		if (activeTokens.length >= MAX_ACTIVE_REFRESH_TOKENS) {
			await this.prisma.refreshToken.update({
				where: { id: activeTokens[0]?.id },
				data: { revokedAt: new Date() },
			});
		}

		const expiresAt = this.calculateExpiry(env.JWT_REFRESH_TOKEN_TTL);

		return this.prisma.refreshToken.create({
			data: {
				userId,
				tokenHash,
				expiresAt,
			},
		});
	}

	private async findValidRefreshToken(userId: string, rawToken: string) {
		const tokenHash = this.hashToken(rawToken);

		return this.prisma.refreshToken.findFirst({
			where: {
				userId,
				tokenHash,
				revokedAt: null,
				expiresAt: { gt: new Date() },
			},
			include: { user: true },
		});
	}

	private async generateTokens(userId: string, email: string) {
		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAccessToken({ sub: userId, email }),
			this.jwtService.signRefreshToken({ sub: userId, email, jti: randomUUID() }),
		]);

		return { accessToken, refreshToken };
	}

	async login(dto: LoginDto) {
		const user = await this.userService.findByEmail(dto.email);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const isPasswordValid = await this.validatePassword(dto.password, user.passwordHash);
		if (!isPasswordValid) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const tokens = await this.generateTokens(user.id, user.email);
		await this.saveRefreshToken(user.id, tokens.refreshToken);

		return { ...tokens, user: { id: user.id, email: user.email, name: user.name } };
	}

	async register(dto: RegisterDto) {
		const existingUser = await this.userService.findByEmail(dto.email);

		if (existingUser) {
			throw new ConflictException("Email already in use");
		}

		const user = await this.userService.createUser(dto);
		const tokens = await this.generateTokens(user.id, user.email);
		await this.saveRefreshToken(user.id, tokens.refreshToken);

		return { ...tokens, user: { id: user.id, email: user.email, name: user.name } };
	}

	async refresh(dto: RefreshTokenDto) {
		const result = await this.jwtService.verify(dto.refreshToken);
		if (!result.valid || !result.decoded) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const userId = result.decoded.sub as string;
		const storedToken = await this.findValidRefreshToken(userId, dto.refreshToken);

		if (!storedToken?.user) {
			throw new UnauthorizedException("Refresh token revoked or not found");
		}

		const tokens = await this.generateTokens(storedToken.user.id, storedToken.user.email);

		await this.prisma.refreshToken.update({
			where: { id: storedToken.id },
			data: { revokedAt: new Date() },
		});

		await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

		return tokens;
	}

	async logout(dto: RefreshTokenDto) {
		const result = await this.jwtService.verify(dto.refreshToken);

		if (!result.valid || !result.decoded) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const userId = result.decoded.sub as string;
		const storedToken = await this.findValidRefreshToken(userId, dto.refreshToken);

		if (storedToken) {
			await this.prisma.refreshToken.update({
				where: { id: storedToken.id },
				data: { revokedAt: new Date() },
			});
		}
	}
}
