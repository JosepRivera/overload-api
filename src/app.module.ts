import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { validate } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { UserModule } from "./user/user.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate,
			isGlobal: true,
			envFilePath: ".env",
		}),
		AuthModule,
		UserModule,
		PrismaModule,
	],
})
export class AppModule {}
