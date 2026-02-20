import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env";
import { JwtService } from "@/jwt/jwt.service";
import { RegisterDto } from "@/user/dto/create-user.dto";
import { UserService } from "@/user/user.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

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
			return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7d
		}

		const value = Number.parseInt(match[1], 10);
		const unit = match[2].toLowerCase();

		const multipliers: Record<string, number> = {
			ms: 1,
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
			w: 7 * 24 * 60 * 60 * 1000,
			y: 365 * 24 * 60 * 60 * 1000,
		};

		return new Date(Date.now() + value * (multipliers[unit] ?? 0));
	}

	private async saveRefreshToken(userId: string, token: string) {
		const tokenHash = await bcrypt.hash(token, env.BCRYPT_ROUNDS);

		await this.prisma.refreshToken.deleteMany({
			where: {
				user_id: userId,
				expires_at: { lt: new Date() },
			},
		});

		const expiresAt = this.calculateExpiry(env.JWT_REFRESH_TOKEN_TTL);

		return this.prisma.refreshToken.create({
			data: {
				user_id: userId,
				token_hash: tokenHash,
				expires_at: expiresAt,
			},
		});
	}

	private async findValidRefreshToken(userId: string, rawToken: string) {
		const tokens = await this.prisma.refreshToken.findMany({
			where: {
				user_id: userId,
				revoked_at: null,
				expires_at: { gt: new Date() },
			},
			include: { user: true },
		});

		for (const stored of tokens) {
			const isMatch = await bcrypt.compare(rawToken, stored.token_hash);
			if (isMatch) return stored;
		}

		return null;
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
		if (!result.valid || !result.decoded) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const userId = result.decoded.sub as string;
		const storedToken = await this.findValidRefreshToken(userId, dto.refreshToken);

		if (!storedToken || !storedToken.user) {
			throw new UnauthorizedException("Refresh token revoked or not found");
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

		if (!result.valid || !result.decoded) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const userId = result.decoded.sub as string;
		const storedToken = await this.findValidRefreshToken(userId, dto.refreshToken);

		if (storedToken) {
			await this.prisma.refreshToken.update({
				where: { id: storedToken.id },
				data: { revoked_at: new Date() },
			});
		}

		return { message: "Logged out successfully" };
	}
}
