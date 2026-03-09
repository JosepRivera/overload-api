import { createZodDto } from "nestjs-zod";
import type { z } from "zod";
import { addRoutineExerciseSchema } from "./add-routine-exercise.dto";

const updateRoutineExerciseSchema = addRoutineExerciseSchema
	.omit({ exercise_id: true })
	.partial()
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
