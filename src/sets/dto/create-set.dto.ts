import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createSetSchema = z.object({
	exercise_id: z.uuid(),
	weight: z.number().min(0).max(9999.99),
	reps: z.number().int().min(1),
	rpe: z.number().min(1).max(10).multipleOf(0.5).optional().nullable(),
	is_warmup: z.boolean().optional().default(false),
});

export class CreateSetDto extends createZodDto(createSetSchema) {}
export type CreateSetInput = z.infer<typeof createSetSchema>;
