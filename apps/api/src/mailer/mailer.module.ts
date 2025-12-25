import { Module } from "@nestjs/common";
import { MailerService } from "./mailer.service";
import { ResendWebhookController } from "./resend-webhook.controller";

@Module({
  providers: [MailerService],
  controllers: [ResendWebhookController],
  exports: [MailerService],
})
export class MailerModule {}

