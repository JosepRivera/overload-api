import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const updateSetSchema = z.object({
	weight: z.number().min(0).max(9999.99).optional(),
	reps: z.number().int().min(1).optional(),
	rpe: z.number().min(1).max(10).multipleOf(0.5).optional().nullable(),
	is_warmup: z.boolean().optional(),
});

export class UpdateSetDto extends createZodDto(updateSetSchema) {}
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
