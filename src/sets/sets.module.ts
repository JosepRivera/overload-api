import { Module } from "@nestjs/common";
import { ExerciseModule } from "@/exercises/exercises.module.js";
import { WorkoutsModule } from "@/workouts/workouts.module.js";
import { SetsController } from "./sets.controller.js";
import { SetsService } from "./sets.service.js";

@Module({
	imports: [WorkoutsModule, ExerciseModule],
	providers: [SetsService],
	controllers: [SetsController],
})
export class SetsModule {}
