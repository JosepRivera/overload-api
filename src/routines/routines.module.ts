import { Module } from "@nestjs/common";
import { RoutinesService } from "./routines.service";

@Module({
	providers: [RoutinesService],
})
export class RoutinesModule {}
