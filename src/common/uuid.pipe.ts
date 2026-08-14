import {
	type ArgumentMetadata,
	BadRequestException,
	Injectable,
	ParseUUIDPipe,
	type PipeTransform,
} from "@nestjs/common";

@Injectable()
export class UuidPipe implements PipeTransform<string, Promise<string>> {
	private readonly inner = new ParseUUIDPipe();

	async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
		try {
			return await this.inner.transform(value, metadata);
		} catch {
			const field = metadata.data ?? "id";
			throw new BadRequestException({
				statusCode: 400,
				message: "Validation failed",
				error: "Bad Request",
				errors: [{ path: [field], message: `${field} must be a valid UUID` }],
			});
		}
	}
}
