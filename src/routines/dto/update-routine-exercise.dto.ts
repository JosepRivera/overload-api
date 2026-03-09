import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const updateRoutineExerciseSchema = z
	.object({
		target_sets: z.number().int().min(1, { message: "target_sets must be at least 1" }).optional(),
		target_reps_min: z
			.number()
			.int()
			.min(1, { message: "target_reps_min must be at least 1" })
			.optional(),
		target_reps_max: z
			.number()
			.int()
			.min(1, { message: "target_reps_max must be at least 1" })
			.optional(),
		target_rest_sec: z
			.number()
			.int()
			.min(0, { message: "target_rest_sec must be 0 or more" })
			.optional(),
		notes: z.string().trim().max(2000).optional().nullable(),
	})
	.refine(
		(data) => {
			if (data.target_reps_min !== undefined && data.target_reps_max !== undefined) {
				return data.target_reps_max >= data.target_reps_min;
			}
			return true;
		},
		{
			message: "target_reps_max must be greater than or equal to target_reps_min",
			path: ["target_reps_max"],
		},
	);

export class UpdateRoutineExerciseDto extends createZodDto(updateRoutineExerciseSchema) {}
export type UpdateRoutineExerciseInput = z.infer<typeof updateRoutineExerciseSchema>;
