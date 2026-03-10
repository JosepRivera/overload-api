import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { env } from "@/config/env";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/transform.interceptor";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(helmet());

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

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api/docs", app, cleanupOpenApiDoc(document));

	await app.listen(env.PORT);
	console.log(`Server running on http://localhost:${env.PORT}`);
	console.log(`Swagger docs available at http://localhost:${env.PORT}/api/docs`);
}
bootstrap();
