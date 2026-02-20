import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JWTPayload } from "jose";

export const CurrentUser = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): JWTPayload => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	},
);
