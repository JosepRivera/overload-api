import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope } from "@/common/api-response.js";
import { EXERCISE_CATEGORIES, EXERCISE_TYPES } from "./create-exercise.dto.js";

export const exerciseSchema = z.object({
	id: z.uuid(),
	name: z.string().meta({ example: "Bench Press" }),
	category: z.enum(EXERCISE_CATEGORIES),
	type: z.enum(EXERCISE_TYPES),
	notes: z.string().nullable(),
	isArchived: z.boolean(),
});

export class ExerciseResponseDto extends createZodDto(envelope(exerciseSchema)) {}
export class ExerciseListResponseDto extends createZodDto(envelope(z.array(exerciseSchema))) {}
