import { Module } from "@nestjs/common";
import { PathwayAuthModule } from "@pathway/auth";
import { ActiveSiteController } from "./active-site.controller";
import { ActiveSiteService } from "./active-site.service";
import { AuthIdentityController } from "./auth-identity.controller";
import { AuthIdentityService } from "./auth-identity.service";
import { AuthUserGuard } from "./auth-user.guard";
import { Auth0ManagementService } from "./auth0-management.service";

@Module({
  imports: [PathwayAuthModule],
  providers: [
    AuthIdentityService,
    ActiveSiteService,
    AuthUserGuard,
    Auth0ManagementService,
  ],
  controllers: [AuthIdentityController, ActiveSiteController],
  exports: [
    AuthIdentityService,
    ActiveSiteService,
    AuthUserGuard,
    Auth0ManagementService,
  ],
})
export class AuthModule {}


