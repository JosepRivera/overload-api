import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ExerciseModule } from "./exercises/exercises.module.js";
import { JwtModule } from "./jwt/jwt.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RoutinesModule } from "./routines/routines.module.js";
import { SetsModule } from "./sets/sets.module.js";
import { UserModule } from "./user/user.module.js";
import { WorkoutsModule } from "./workouts/workouts.module.js";

@Module({
	imports: [
		JwtModule,
		PrismaModule,
		AuthModule,
		UserModule,
		ExerciseModule,
		RoutinesModule,
		WorkoutsModule,
		SetsModule,
		AnalyticsModule,
	],
})
export class AppModule {}
