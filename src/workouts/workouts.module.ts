import { Module } from "@nestjs/common";
import { RoutinesModule } from "@/routines/routines.module.js";
import { WorkoutsController } from "./workouts.controller.js";
import { WorkoutsService } from "./workouts.service.js";

@Module({
	imports: [RoutinesModule],
	controllers: [WorkoutsController],
	providers: [WorkoutsService],
	exports: [WorkoutsService],
})
export class WorkoutsModule {}
