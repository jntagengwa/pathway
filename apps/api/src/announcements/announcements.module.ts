import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { BillingModule } from "../billing/billing.module";
import { AuthModule } from "../auth/auth.module";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";

@Module({
  imports: [CommonModule, BillingModule, AuthModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
