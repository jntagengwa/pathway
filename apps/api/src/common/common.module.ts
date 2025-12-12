import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PathwayAuthModule } from "@pathway/auth";
import { TenantRlsInterceptor } from "./database/tenant-rls.interceptor";

@Module({
  imports: [PathwayAuthModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRlsInterceptor,
    },
  ],
  exports: [PathwayAuthModule],
})
export class CommonModule {}
