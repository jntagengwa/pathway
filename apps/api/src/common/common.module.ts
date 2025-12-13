import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PathwayAuthModule } from "@pathway/auth";
import { TenantRlsInterceptor } from "./database/tenant-rls.interceptor";
import { LoggingService } from "./logging/logging.service";

@Module({
  imports: [PathwayAuthModule],
  providers: [
    LoggingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRlsInterceptor,
    },
  ],
  exports: [PathwayAuthModule, LoggingService],
})
export class CommonModule {}
