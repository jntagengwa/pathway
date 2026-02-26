import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { HandoverController } from "./handover.controller";
import { HandoverAdminController } from "./handover.admin.controller";
import { HandoverService } from "./handover.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [HandoverController, HandoverAdminController],
  providers: [HandoverService],
  exports: [HandoverService],
})
export class HandoverModule {}

