import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const loginSchema = z.object({
	email: z.email({ error: "Must be a valid email address" }),
	password: z.string().min(1, { error: "Password is required" }),
});

export class LoginDto extends createZodDto(loginSchema) {}
export type LoginInput = z.infer<typeof loginSchema>;
