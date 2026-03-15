import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const listWorkoutsSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListWorkoutsDto extends createZodDto(listWorkoutsSchema) {}
export type ListWorkoutsInput = z.infer<typeof listWorkoutsSchema>;
