import { Module } from "@nestjs/common";
import { ExerciseController } from "./exercises.controller.js";
import { ExerciseService } from "./exercises.service.js";

@Module({
	providers: [ExerciseService],
	controllers: [ExerciseController],
	exports: [ExerciseService],
})
export class ExerciseModule {}
