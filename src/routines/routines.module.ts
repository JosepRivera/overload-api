import { Module } from "@nestjs/common";
import { ExerciseModule } from "@/exercises/exercises.module.js";
import { RoutinesController } from "./routines.controller.js";
import { RoutinesService } from "./routines.service.js";

@Module({
	imports: [ExerciseModule],
	providers: [RoutinesService],
	controllers: [RoutinesController],
	exports: [RoutinesService],
})
export class RoutinesModule {}
