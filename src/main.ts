import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { env } from "@/config/env.js";
import { AppModule } from "./app.module.js";
import { stripSchemaNoise } from "./common/strip-schema-noise.js";
import { TransformInterceptor } from "./common/transform.interceptor.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(new ZodValidationPipe());
	app.useGlobalInterceptors(new TransformInterceptor());
	app.enableShutdownHooks();

	await app.listen(env.PORT, "0.0.0.0");
	console.log(`Server running on http://localhost:${env.PORT}`);

	if (env.NODE_ENV === "development") {
		const config = new DocumentBuilder()
			.setTitle("Overload API")
			.setDescription(
				[
					"REST API for strength training tracking."
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
				theme: "deepSpace",
				persistAuth: true,
				authentication: {
					preferredSecurityScheme: "bearer",
				},
			}),
		);

		console.log(`API reference available at http://localhost:${env.PORT}/api/docs`);
		console.log(`Documentation available at http://localhost:4321`);
	}
}
bootstrap();
