import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, { error: "Refresh token is required" }),
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
