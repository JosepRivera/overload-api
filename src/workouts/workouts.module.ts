import { Module } from "@nestjs/common";
import { RoutinesModule } from "@/routines/routines.module";
import { WorkoutsController } from "./workouts.controller";
import { WorkoutsService } from "./workouts.service";

@Module({
	imports: [RoutinesModule],
	controllers: [WorkoutsController],
	providers: [WorkoutsService],
	exports: [WorkoutsService],
})
export class WorkoutsModule {}
