import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { JwtModule } from "./jwt/jwt.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UserModule } from "./user/user.module";

@Module({
	imports: [JwtModule, PrismaModule, AuthModule, UserModule],
})
export class AppModule {}
