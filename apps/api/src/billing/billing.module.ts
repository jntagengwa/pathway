import { Module } from "@nestjs/common";
import { PathwayAuthModule } from "@pathway/auth";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { EntitlementsService } from "./entitlements.service";

@Module({
  imports: [PathwayAuthModule],
  controllers: [BillingController],
  providers: [BillingService, EntitlementsService],
  exports: [BillingService, EntitlementsService],
})
export class BillingModule {}
