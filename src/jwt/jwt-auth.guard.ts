import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "./jwt.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		const token = this.extractTokenFromHeader(request);
		if (!token) {
			throw new UnauthorizedException("No token provided");
		}

		const result = await this.jwtService.verify(token);
		if (!result.valid || !result.decoded) {
			throw new UnauthorizedException("Invalid or expired token");
		}

		request.user = result.decoded;

		return true;
	}

	private extractTokenFromHeader(request: Request): string | null {
		const authHeader = request.headers.authorization;
		if (!authHeader) return null;

		const [type, token] = authHeader.split(" ");
		return type === "Bearer" ? token : null;
	}
}
