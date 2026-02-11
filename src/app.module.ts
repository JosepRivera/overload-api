import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { validate } from "./config/env";
import { PrismaService } from "./prisma/prisma.service";
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
	],
	providers: [PrismaService],
	exports: [PrismaService],
})
export class AppModule {}
