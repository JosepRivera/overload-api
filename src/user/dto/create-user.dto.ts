import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const registerSchema = z.object({
	email: z.email({ error: "Must be a valid email address" }),
	name: z
		.string()
		.trim()
		.min(2, { error: "Name must be at least 2 characters long" })
		.max(100, "Name is too long"),
	password: z.string().min(8, { error: "Password must be at least 8 characters long" }),
});

export class RegisterDto extends createZodDto(registerSchema) {}
export type RegisterInput = z.infer<typeof registerSchema>;
