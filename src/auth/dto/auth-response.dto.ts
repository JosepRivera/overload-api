import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope } from "@/common/api-response.js";
import { userSchema } from "@/user/dto/user-response.dto.js";

const tokensSchema = z.object({
	accessToken: z.string().meta({ example: "eyJhbGciOiJIUzI1NiJ9..." }),
	refreshToken: z.string().meta({ example: "eyJhbGciOiJIUzI1NiJ9..." }),
});

const sessionSchema = tokensSchema.extend({
	user: userSchema,
});

export class AuthSessionResponseDto extends createZodDto(envelope(sessionSchema)) {}
export class AuthTokensResponseDto extends createZodDto(envelope(tokensSchema)) {}
