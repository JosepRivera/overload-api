import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope } from "@/common/api-response.js";

export const userSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	name: z.string().meta({ example: "Ada Lovelace" }),
});

export class UserResponseDto extends createZodDto(envelope(userSchema)) {}
