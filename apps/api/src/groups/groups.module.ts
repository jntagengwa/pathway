import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";

@Module({
  imports: [CommonModule, AuthModule, BillingModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
