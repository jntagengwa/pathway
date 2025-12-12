import { Module } from "@nestjs/common";
import { PathwayRequestContext } from "./context/pathway-request-context.service";
import { PathwayAuthGuard } from "./guards/pathway-auth.guard";

@Module({
  providers: [PathwayRequestContext, PathwayAuthGuard],
  exports: [PathwayRequestContext, PathwayAuthGuard],
})
export class PathwayAuthModule {}

