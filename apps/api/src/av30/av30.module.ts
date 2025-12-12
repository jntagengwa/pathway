import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { Av30ActivityService } from "./av30-activity.service";

@Module({
  imports: [CommonModule],
  providers: [Av30ActivityService],
  exports: [Av30ActivityService],
})
export class Av30Module {}
