import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const reorderRoutineExercisesSchema = z.object({
	exercises: z
		.array(
			z.object({
				id: z.uuid({ error: "id must be a valid UUID" }),
				order_index: z.number().int().min(0, { error: "order_index must be 0 or more" }),
			}),
		)
		.min(1, { error: "exercises array must not be empty" })
		.refine(
			(items) => {
				const indices = items.map((i) => i.order_index);
				return new Set(indices).size === indices.length;
			},
			{ error: "order_index values must be unique" },
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
