import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { SafeguardingModule } from "../common/safeguarding/safeguarding.module";
import { AuditModule } from "../audit/audit.module";
import { ConcernsController } from "./concerns.controller";
import { ConcernsService } from "./concerns.service";

@Module({
  imports: [CommonModule, AuditModule, SafeguardingModule],
  controllers: [ConcernsController],
  providers: [ConcernsService],
  exports: [ConcernsService],
})
export class ConcernsModule {}
