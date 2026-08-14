import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope, timestamp } from "@/common/api-response.js";

const workoutSchema = z.object({
	id: z.uuid(),
	routineId: z.uuid().nullable(),
	startedAt: timestamp,
	finishedAt: timestamp.nullable(),
	notes: z.string().nullable(),
});

export class WorkoutResponseDto extends createZodDto(envelope(workoutSchema)) {}

export class ActiveWorkoutResponseDto extends createZodDto(envelope(workoutSchema.nullable())) {}

export class WorkoutListResponseDto extends createZodDto(
	envelope(
		z.object({
			workouts: z.array(workoutSchema),
			total: z.number().int().meta({ example: 42 }),
			page: z.number().int().meta({ example: 1 }),
			limit: z.number().int().meta({ example: 20 }),
		}),
	),
) {}
