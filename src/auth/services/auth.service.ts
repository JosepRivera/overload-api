import { Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { env } from "@/config/env";
import { UserService } from "@/user/user.service";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginInput } from "../dto/login.dto";
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

	async login(dto: LoginInput) {
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
}
