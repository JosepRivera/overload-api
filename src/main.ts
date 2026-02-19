import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { ZodValidationPipe } from "nestjs-zod";
import { env } from "@/config/env";
import { AppModule } from "./app.module";

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

	await app.listen(env.PORT);
	console.log(`Server running on http://localhost:${env.PORT}`);
}
bootstrap();
