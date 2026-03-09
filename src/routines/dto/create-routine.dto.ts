import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createRoutineSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { error: "Name is required" })
		.max(150, { error: "Name must be at most 150 characters" }),
	description: z.string().trim().max(2000).optional().nullable(),
});

export class CreateRoutineDto extends createZodDto(createRoutineSchema) {}
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
