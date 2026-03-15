import { createZodDto } from "nestjs-zod";
import type { z } from "zod";
import { createSetSchema } from "./create-set.dto";

export const updateSetSchema = createSetSchema
	.omit({ exercise_id: true })
	.partial()
	.refine((data) => Object.values(data).some((v) => v !== undefined), {
		message: "At least one field must be provided",
	});

export class UpdateSetDto extends createZodDto(updateSetSchema) {}
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
