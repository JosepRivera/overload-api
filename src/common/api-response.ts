import { ApiResponse } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const envelope = <T extends z.ZodType>(schema: T) => z.object({ data: schema });

export const timestamp = z.iso.datetime();

const errorSchema = z.object({
	statusCode: z.number().int(),
	message: z.string(),
	error: z.string(),
	errors: z
		.array(
			z.object({
				path: z.array(z.union([z.string(), z.number()])),
				message: z.string(),
			}),
		)
		.optional(),
});

export class ErrorResponseDto extends createZodDto(errorSchema) {}

const STATUS_TEXT: Record<number, string> = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	409: "Conflict",
	503: "Service Unavailable",
};

export const ApiError = (status: number, description: string) =>
	ApiResponse({
		status,
		description,
		type: ErrorResponseDto,
		example: {
			statusCode: status,
			message: description,
			error: STATUS_TEXT[status],
		},
	});

export const ApiValidationError = (
	description = "Validation failed",
	errorsExample: Array<{ path: Array<string | number>; message: string }> = [
		{ path: ["name"], message: "Name is required" },
	],
) =>
	ApiResponse({
		status: 400,
		description,
		type: ErrorResponseDto,
		example: {
			statusCode: 400,
			message: "Validation failed",
			error: "Bad Request",
			errors: errorsExample,
		},
	});

export const uuidField = (field: string) => ({
	path: [field],
	message: `${field} must be a valid UUID`,
});
