import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import helmet from "helmet";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { env } from "@/config/env.js";
import { AppModule } from "./app.module.js";
import { TransformInterceptor } from "./common/transform.interceptor.js";

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

	const config = new DocumentBuilder()
		.setTitle("Overload API")
		.setDescription("REST API for strength training tracking")
		.setVersion("1.0")
		.addServer(`http://localhost:${env.PORT}`, "Development")
		.addBearerAuth()
		.build();

	const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
	app.use(
		"/api/docs",
		apiReference({
			content: document,
			theme: "default",
		}),
	);

	await app.listen(env.PORT, "0.0.0.0");
	console.log(`Server running on http://localhost:${env.PORT}`);
	console.log(`API reference available at http://localhost:${env.PORT}/api/docs`);
	console.log(`Documentation available at http://localhost:4321`);
}
bootstrap();
