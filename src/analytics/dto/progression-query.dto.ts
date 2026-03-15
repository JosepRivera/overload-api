import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const progressionQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ProgressionQueryDto extends createZodDto(progressionQuerySchema) {}
export type ProgressionQueryInput = z.infer<typeof progressionQuerySchema>;
