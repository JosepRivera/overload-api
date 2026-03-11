import { Module } from "@nestjs/common";
import { ExerciseModule } from "@/exercises/exercises.module";
import { RoutinesController } from "./routines.controller";
import { RoutinesService } from "./routines.service";

@Module({
	imports: [ExerciseModule],
	providers: [RoutinesService],
	controllers: [RoutinesController],
})
export class RoutinesModule {}
