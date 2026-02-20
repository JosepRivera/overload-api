import { Module } from "@nestjs/common";
import { ExerciseController } from "./exercise.controller";
import { ExerciseService } from "./exercise.service";

@Module({
	providers: [ExerciseService],
	controllers: [ExerciseController],
})
export class ExerciseModule {}
