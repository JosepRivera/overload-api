import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const EXERCISE_CATEGORIES = [
	"chest",
	"back",
	"legs",
	"shoulders",
	"arms",
	"core",
	"cardio",
	"other",
] as const;

export const EXERCISE_TYPES = ["compound", "isolation", "cardio", "stretching"] as const;

export const createExerciseSchema = z.object({
	name: z.string().trim().min(1).max(150),
	category: z.enum(EXERCISE_CATEGORIES),
	type: z.enum(EXERCISE_TYPES),
	notes: z.string().max(2000).optional().nullable(),
});

export class CreateExerciseDto extends createZodDto(createExerciseSchema) {}
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
