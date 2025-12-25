import { Module } from "@nestjs/common";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";
import { AuthModule } from "../auth/auth.module";
import { MailerModule } from "../mailer/mailer.module";

@Module({
  imports: [AuthModule, MailerModule],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}

