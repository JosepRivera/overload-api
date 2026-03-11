import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createWorkoutSchema = z.object({
	routine_id: z.uuid({ error: "Routine ID must be a valid UUID" }).optional(),
	started_at: z.iso
		.datetime({ error: "started_at must be a valid ISO 8601 date" })
		.refine((val) => new Date(val) <= new Date(), {
			error: "started_at cannot be in the future",
		})
		.transform((val) => new Date(val)),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export class CreateWorkoutDto extends createZodDto(createWorkoutSchema) {}
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
