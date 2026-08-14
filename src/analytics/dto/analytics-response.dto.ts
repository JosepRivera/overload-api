import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope, timestamp } from "@/common/api-response.js";

export class ExercisePrsResponseDto extends createZodDto(
	envelope(
		z.object({
			weightPr: z.number().nullable().meta({ example: 100 }),
			volumePr: z.number().nullable().meta({ example: 640 }),
		}),
	),
) {}

export class Exercise1rmResponseDto extends createZodDto(
	envelope(
		z.object({
			exerciseId: z.uuid(),
			estimated1rm: z.number().nullable().meta({ example: 120 }),
			basedOn: z
				.object({
					weight: z.number().meta({ example: 100 }),
					reps: z.number().int().meta({ example: 6 }),
				})
				.nullable(),
		}),
	),
) {}

export class ExerciseProgressionResponseDto extends createZodDto(
	envelope(
		z.array(
			z.object({
				workoutId: z.uuid(),
				date: timestamp,
				totalVolume: z.number().meta({ example: 1240 }),
				avgWeight: z.number().meta({ example: 90 }),
				avgReps: z.number().meta({ example: 7 }),
			}),
		),
	),
) {}

export class WorkoutVolumeResponseDto extends createZodDto(
	envelope(
		z.object({
			workoutId: z.uuid(),
			totalVolume: z.number().meta({ example: 1240 }),
		}),
	),
) {}
