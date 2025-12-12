import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { Av30Module } from "../av30/av30.module";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  imports: [CommonModule, Av30Module],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
