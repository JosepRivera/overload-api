import { Global, Module } from "@nestjs/common";
import { JwtService } from "./jwt.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Global()
@Module({
	providers: [JwtService, JwtAuthGuard],
	exports: [JwtService, JwtAuthGuard],
})
export class JwtModule {}
