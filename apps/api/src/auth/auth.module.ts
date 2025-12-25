import { Module } from "@nestjs/common";
import { PathwayAuthModule } from "@pathway/auth";
import { ActiveSiteController } from "./active-site.controller";
import { ActiveSiteService } from "./active-site.service";
import { AuthIdentityController } from "./auth-identity.controller";
import { AuthIdentityService } from "./auth-identity.service";
import { AuthUserGuard } from "./auth-user.guard";

@Module({
  imports: [PathwayAuthModule],
  providers: [AuthIdentityService, ActiveSiteService, AuthUserGuard],
  controllers: [AuthIdentityController, ActiveSiteController],
  exports: [AuthIdentityService, ActiveSiteService, AuthUserGuard],
})
export class AuthModule {}


