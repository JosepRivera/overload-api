import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const addRoutineExerciseSchema = z
	.object({
		exerciseId: z.uuid({ error: "exerciseId must be a valid UUID" }),
		targetSets: z.number().int().min(1, { error: "targetSets must be at least 1" }),
		targetRepsMin: z.number().int().min(1, { error: "targetRepsMin must be at least 1" }),
		targetRepsMax: z.number().int().min(1, { error: "targetRepsMax must be at least 1" }),
		targetRestSec: z.number().int().min(0, { error: "targetRestSec must be 0 or more" }),
		notes: z.string().trim().max(2000).optional().nullable(),
	})
	.refine((data) => data.targetRepsMax >= data.targetRepsMin, {
		error: "targetRepsMax must be greater than or equal to targetRepsMin",
		path: ["targetRepsMax"],
	});

export class AddRoutineExerciseDto extends createZodDto(addRoutineExerciseSchema) {}
export type AddRoutineExerciseInput = z.infer<typeof addRoutineExerciseSchema>;
