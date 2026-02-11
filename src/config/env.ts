import { z } from "zod";
import "dotenv/config";

const msString = z
	.string()
	.refine((val) => /^\d+\s*(ms|s|m|h|d|w|y)$/i.test(val), {
		error: "Invalid duration. Use formats like 15m, 7d, 1h, 500ms.",
	})
	.transform((val) => val.replace(/\s+/g, "").toLowerCase());

export const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3000),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	DATABASE_URL: z.url(),
	JWT_SECRET: z.string().min(32),
	JWT_ACCESS_TOKEN_TTL: msString.default("15m"),
	JWT_REFRESH_TOKEN_TTL: msString.default("7d"),
	CORS_ORIGIN: z.url().optional(),
	BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);

export function validate(config: Record<string, unknown>): Env {
	return envSchema.parse(config);
}
