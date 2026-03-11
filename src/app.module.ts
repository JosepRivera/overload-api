import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ExerciseModule } from "./exercises/exercises.module";
import { JwtModule } from "./jwt/jwt.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RoutinesModule } from "./routines/routines.module";
import { UserModule } from "./user/user.module";
import { WorkoutsModule } from "./workouts/workouts.module";

@Module({
	imports: [
		JwtModule,
		PrismaModule,
		AuthModule,
		UserModule,
		ExerciseModule,
		RoutinesModule,
		WorkoutsModule,
	],
})
export class AppModule {}
