import { Module } from "@nestjs/common";
import { ExerciseModule } from "@/exercises/exercises.module";
import { WorkoutsModule } from "@/workouts/workouts.module";
import { SetsController } from "./sets.controller";
import { SetsService } from "./sets.service";

@Module({
	imports: [WorkoutsModule, ExerciseModule],
	providers: [SetsService],
	controllers: [SetsController],
})
export class SetsModule {}
