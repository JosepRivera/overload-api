import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const updateRoutineExerciseSchema = z
	.object({
		targetSets: z.number().int().min(1, { message: "targetSets must be at least 1" }).optional(),
		targetRepsMin: z
			.number()
			.int()
			.min(1, { message: "targetRepsMin must be at least 1" })
			.optional(),
		targetRepsMax: z
			.number()
			.int()
			.min(1, { message: "targetRepsMax must be at least 1" })
			.optional(),
		targetRestSec: z
			.number()
			.int()
			.min(0, { message: "targetRestSec must be 0 or more" })
			.optional(),
		notes: z.string().trim().max(2000).optional().nullable(),
	})
	.refine(
		(data) => {
			if (data.targetRepsMin !== undefined && data.targetRepsMax !== undefined) {
				return data.targetRepsMax >= data.targetRepsMin;
			}
			return true;
		},
		{
			message: "targetRepsMax must be greater than or equal to targetRepsMin",
			path: ["targetRepsMax"],
		},
	);

export class UpdateRoutineExerciseDto extends createZodDto(updateRoutineExerciseSchema) {}
export type UpdateRoutineExerciseInput = z.infer<typeof updateRoutineExerciseSchema>;
