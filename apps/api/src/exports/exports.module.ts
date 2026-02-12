import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { ExportsController } from "./exports.controller";
import { ExportsService } from "./exports.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
