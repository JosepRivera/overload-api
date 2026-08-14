import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import helmet from "helmet";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { env } from "@/config/env.js";
import { AppModule } from "./app.module.js";
import { TransformInterceptor } from "./common/transform.interceptor.js";

const SAFE_INTEGER_BOUNDS = new Set([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);

function stripSchemaNoise(node: unknown): void {
	if (Array.isArray(node)) {
		for (const item of node) stripSchemaNoise(item);
		return;
	}
	if (node === null || typeof node !== "object") return;

	const schema = node as Record<string, unknown>;
	if (typeof schema.format === "string" && typeof schema.pattern === "string") {
		delete schema.pattern;
	}
	if (schema.type === "integer") {
		for (const bound of ["minimum", "maximum"] as const) {
			if (typeof schema[bound] === "number" && SAFE_INTEGER_BOUNDS.has(schema[bound])) {
				delete schema[bound];
			}
		}
	}
	for (const value of Object.values(schema)) stripSchemaNoise(value);
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
					styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
					imgSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
					connectSrc: ["'self'"],
					fontSrc: ["'self'", "cdn.jsdelivr.net"],
					objectSrc: ["'none'"],
				},
			},
		}),
	);

	app.enableCors({
		origin: env.CORS_ORIGIN,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});

	app.useGlobalPipes(new ZodValidationPipe());
	app.useGlobalInterceptors(new TransformInterceptor());

	if (env.NODE_ENV === "development") {
		const config = new DocumentBuilder()
			.setTitle("Overload API")
			.setDescription(
				[
					"REST API for strength training tracking.",
					"",
					"### Response envelope",
					"Every successful response with a body is wrapped in a `data` property:",
					'`{ "data": { ... } }`. Endpoints returning `204 No Content` send no body.',
					"",
					"### Errors",
					'Errors are returned unwrapped as `{ "statusCode", "message", "error" }`.',
					"Body validation failures add an `errors` array with the offending `path` and `message`.",
					"",
					"### Authentication",
					"All endpoints except `/health` and `/auth/*` require an access token:",
					"`Authorization: Bearer <accessToken>`. Tokens are issued by `/auth/register` and `/auth/login`.",
				].join("\n"),
			)
			.setVersion("1.0")
			.addServer(`http://localhost:${env.PORT}`, "Development")
			.addBearerAuth()
			.build();

		const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
		stripSchemaNoise(document);
		app.use(
			"/api/docs",
			apiReference({
				content: document,
				theme: "mars",
				persistAuth: true,
				authentication: {
					preferredSecurityScheme: "bearer",
				},
			}),
		);
	}

	await app.listen(env.PORT, "0.0.0.0");
	console.log(`Server running on http://localhost:${env.PORT}`);
	if (env.NODE_ENV === "development") {
		console.log(`API reference available at http://localhost:${env.PORT}/api/docs`);
		console.log(`Documentation available at http://localhost:4321`);
	}
}
bootstrap();
