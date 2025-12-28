import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
  imports: [CommonModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}

