import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const updateWorkoutSchema = z.object({
	notes: z.string().trim().max(2000).optional().nullable(),
});

export class UpdateWorkoutDto extends createZodDto(updateWorkoutSchema) {}
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
