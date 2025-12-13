import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { SafeguardingModule } from "../common/safeguarding/safeguarding.module";
import { DsarController } from "./dsar.controller";
import { DsarService } from "./dsar.service";

@Module({
  imports: [CommonModule, SafeguardingModule],
  controllers: [DsarController],
  providers: [DsarService],
  exports: [DsarService],
})
export class DsarModule {}

