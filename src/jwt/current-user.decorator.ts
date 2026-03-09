import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "./types/jwt.types";

export const CurrentUser = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): AuthUser => {
		const request = ctx.switchToHttp().getRequest();
		return request.user as AuthUser;
	},
);
