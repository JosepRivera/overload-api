import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/auth.service";
import { JwtService } from "./services/jwt.service";

@Module({
	providers: [AuthService, JwtService],
	controllers: [AuthController],
})
export class AuthModule {}
