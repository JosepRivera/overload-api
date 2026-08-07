import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const reorderRoutineExercisesSchema = z.object({
	exercises: z
		.array(
			z.object({
				id: z.uuid({ error: "id must be a valid UUID" }),
				orderIndex: z.number().int().min(0, { error: "orderIndex must be 0 or more" }),
			}),
		)
		.min(1, { error: "exercises array must not be empty" })
		.refine(
			(items) => {
				const indices = items.map((i) => i.orderIndex);
				return new Set(indices).size === indices.length;
			},
			{ error: "orderIndex values must be unique" },
		)
		.refine(
			(items) => {
				const ids = items.map((i) => i.id);
				return new Set(ids).size === ids.length;
			},
			{ error: "exercise ids must be unique" },
		),
});

export class ReorderRoutineExercisesDto extends createZodDto(reorderRoutineExercisesSchema) {}
export type ReorderRoutineExercisesInput = z.infer<typeof reorderRoutineExercisesSchema>;
