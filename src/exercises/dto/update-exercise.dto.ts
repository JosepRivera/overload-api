import { createZodDto } from "nestjs-zod";
import type { z } from "zod";
import { createExerciseSchema } from "./create-exercise.dto";

const updateExerciseSchema = createExerciseSchema.partial();

export class UpdateExerciseDto extends createZodDto(updateExerciseSchema) {}
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
