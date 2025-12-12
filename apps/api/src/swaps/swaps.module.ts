import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { SwapsController } from "./swaps.controller";
import { SwapsService } from "./swaps.service";

@Module({
  imports: [CommonModule],
  controllers: [SwapsController],
  providers: [SwapsService],
  exports: [SwapsService],
})
export class SwapsModule {}
