import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { LessonsController } from "./lessons.controller";
import { LessonsService } from "./lessons.service";

@Module({
  imports: [CommonModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
