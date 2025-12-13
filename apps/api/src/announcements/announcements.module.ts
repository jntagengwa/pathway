import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { BillingModule } from "../billing/billing.module";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";

@Module({
  imports: [CommonModule, BillingModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
