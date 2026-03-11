import { Module } from "@nestjs/common";
import { ExerciseController } from "./exercises.controller";
import { ExerciseService } from "./exercises.service";

@Module({
	providers: [ExerciseService],
	controllers: [ExerciseController],
	exports: [ExerciseService],
})
export class ExerciseModule {}
