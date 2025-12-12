import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { ChildrenController } from "./children.controller";
import { ChildrenService } from "./children.service";

@Module({
  imports: [CommonModule],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
