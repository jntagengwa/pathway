import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { BillingModule } from "../billing/billing.module";
import { OrgsController } from "./orgs.controller";
import { OrgsService } from "./orgs.service";

@Module({
  imports: [CommonModule, BillingModule],
  controllers: [OrgsController],
  providers: [OrgsService],
  exports: [OrgsService],
})
export class OrgsModule {}
