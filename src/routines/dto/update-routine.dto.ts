import { createZodDto } from "nestjs-zod";
import type { z } from "zod";
import { createRoutineSchema } from "./create-routine.dto";

const updateRoutineSchema = createRoutineSchema.partial();

export class UpdateRoutineDto extends createZodDto(updateRoutineSchema) {}
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
