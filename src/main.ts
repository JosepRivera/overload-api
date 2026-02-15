import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { env } from "@/config/env";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(helmet());
	await app.listen(env.PORT);
}
bootstrap();
