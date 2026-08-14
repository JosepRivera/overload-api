import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope } from "@/common/api-response.js";
import { exerciseSchema } from "@/exercises/dto/exercise-response.dto.js";

const routineSchema = z.object({
	id: z.uuid(),
	name: z.string().meta({ example: "Push Day" }),
	description: z.string().nullable(),
	isActive: z.boolean(),
});

const routineExerciseSchema = z.object({
	id: z.uuid(),
	exerciseId: z.uuid(),
	targetSets: z.number().int().meta({ example: 4 }),
	targetRepsMin: z.number().int().meta({ example: 6 }),
	targetRepsMax: z.number().int().meta({ example: 10 }),
	targetRestSec: z.number().int().meta({ example: 120 }),
	orderIndex: z.number().int().meta({ example: 0 }),
	notes: z.string().nullable(),
});

const routineExerciseWithExerciseSchema = routineExerciseSchema.omit({ exerciseId: true }).extend({
	exercise: exerciseSchema.pick({
		id: true,
		name: true,
		category: true,
		type: true,
		isArchived: true,
	}),
});

export class RoutineResponseDto extends createZodDto(envelope(routineSchema)) {}
export class RoutineListResponseDto extends createZodDto(envelope(z.array(routineSchema))) {}

export class RoutineDetailResponseDto extends createZodDto(
	envelope(
		routineSchema.extend({
			routineExercises: z.array(routineExerciseWithExerciseSchema),
		}),
	),
) {}

export class RoutineExerciseResponseDto extends createZodDto(envelope(routineExerciseSchema)) {}

export class RoutineExerciseListResponseDto extends createZodDto(
	envelope(z.array(routineExerciseWithExerciseSchema)),
) {}
