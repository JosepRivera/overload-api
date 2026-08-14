import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { envelope } from "@/common/api-response.js";

const setSchema = z.object({
	id: z.uuid(),
	exerciseId: z.uuid(),
	setNumber: z.number().int().meta({ example: 1 }),
	weight: z.number().meta({ example: 100 }),
	reps: z.number().int().meta({ example: 5 }),
	rpe: z.number().nullable().meta({ example: 8.5 }),
	isWarmup: z.boolean(),
});

export class SetResponseDto extends createZodDto(envelope(setSchema)) {}
export class SetListResponseDto extends createZodDto(envelope(z.array(setSchema))) {}
