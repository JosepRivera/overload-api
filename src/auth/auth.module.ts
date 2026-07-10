import { Module } from "@nestjs/common";
import { UserModule } from "@/user/user.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
	imports: [UserModule],
	providers: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
