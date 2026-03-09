import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const addRoutineExerciseSchema = z
	.object({
		exercise_id: z.uuid({ error: "exercise_id must be a valid UUID" }),
		target_sets: z.number().int().min(1, { error: "target_sets must be at least 1" }),
		target_reps_min: z.number().int().min(1, { error: "target_reps_min must be at least 1" }),
		target_reps_max: z.number().int().min(1, { error: "target_reps_max must be at least 1" }),
		target_rest_sec: z.number().int().min(0, { error: "target_rest_sec must be 0 or more" }),
		notes: z.string().trim().max(2000).optional().nullable(),
	})
	.refine((data) => data.target_reps_max >= data.target_reps_min, {
		error: "target_reps_max must be greater than or equal to target_reps_min",
		path: ["target_reps_max"],
	});

export class AddRoutineExerciseDto extends createZodDto(addRoutineExerciseSchema) {}
export type AddRoutineExerciseInput = z.infer<typeof addRoutineExerciseSchema>;
