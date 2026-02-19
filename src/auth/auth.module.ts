import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { UserModule } from "@/user/user.module";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./services/auth.service";
import { JwtService } from "./services/jwt.service";

@Module({
	imports: [PrismaModule, UserModule],
	providers: [AuthService, JwtService, JwtAuthGuard],
	controllers: [AuthController],
})
export class AuthModule {}
