import {
	BadRequestException,
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { ZodValidationException } from "nestjs-zod";
import type { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import type { ZodError } from "zod";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
	intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			map((data) => {
				if (data === null || data === undefined) return data;
				return { data };
			}),
			catchError((err) => {
				if (err instanceof ZodValidationException) {
					const zodError = err.getZodError() as ZodError;
					const errors = zodError.issues.map((i) => ({
						path: i.path,
						message: i.message,
					}));
					throw new BadRequestException({
						statusCode: 400,
						message: "Validation failed",
						errors,
					});
				}
				throw err;
			}),
		);
	}
}
