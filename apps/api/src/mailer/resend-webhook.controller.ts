import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { createHmac } from "crypto";
import type { Request } from "express";

type ResendWebhookEvent = {
  type: "email.sent" | "email.delivered" | "email.delivery_delayed" | "email.complained" | "email.bounced" | "email.opened" | "email.clicked";
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    // Additional fields vary by event type
    [key: string]: unknown;
  };
};

@Controller("webhooks/resend")
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);
  private readonly webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
    @Body() body: ResendWebhookEvent,
  ) {
    // Verify webhook signature if secret is configured
    if (this.webhookSecret) {
      this.verifyWebhookSignature(
        req.rawBody?.toString() || JSON.stringify(body),
        svixId,
        svixTimestamp,
        svixSignature,
      );
    } else {
      this.logger.warn(
        "RESEND_WEBHOOK_SECRET not set - webhook signature verification skipped",
      );
    }

    // Handle different event types
    switch (body.type) {
      case "email.sent":
        this.logger.log(
          `Email sent: ${body.data.email_id} to ${body.data.to.join(", ")}`,
        );
        break;

      case "email.delivered":
        this.logger.log(
          `Email delivered: ${body.data.email_id} to ${body.data.to.join(", ")}`,
        );
        // TODO: Update invite record with delivery confirmation
        break;

      case "email.delivery_delayed":
        this.logger.warn(
          `Email delivery delayed: ${body.data.email_id} to ${body.data.to.join(", ")}`,
        );
        break;

      case "email.bounced":
        this.logger.error(
          `Email bounced: ${body.data.email_id} to ${body.data.to.join(", ")}`,
        );
        // TODO: Mark invite as bounced, possibly revoke it
        break;

      case "email.complained":
        this.logger.error(
          `Spam complaint: ${body.data.email_id} to ${body.data.to.join(", ")}`,
        );
        // TODO: Handle spam complaint - may need to add email to suppression list
        break;

      case "email.opened":
        this.logger.debug(
          `Email opened: ${body.data.email_id} by ${body.data.to.join(", ")}`,
        );
        break;

      case "email.clicked":
        this.logger.debug(
          `Email link clicked: ${body.data.email_id} by ${body.data.to.join(", ")}`,
        );
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${body.type}`);
    }

    return { received: true };
  }

  /**
   * Verify webhook signature using Svix headers and HMAC
   * Based on Resend/Svix webhook verification docs
   */
  private verifyWebhookSignature(
    rawBody: string,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): void {
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException("Missing required webhook headers");
    }

    if (!this.webhookSecret) {
      throw new BadRequestException("Webhook secret not configured");
    }

    // Resend uses Svix for webhook signing
    // Signature format: v1,signature1 v1,signature2
    const signatures = svixSignature.split(" ");

    // Create the signed content
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

    // Verify at least one signature matches
    const secret = this.webhookSecret.startsWith("whsec_")
      ? this.webhookSecret.slice(6) // Remove whsec_ prefix
      : this.webhookSecret;

    const secretBytes = Buffer.from(secret, "base64");

    let validSignature = false;
    for (const versionedSig of signatures) {
      const [version, signature] = versionedSig.split(",");

      if (version !== "v1") {
        continue;
      }

      const expectedSignature = createHmac("sha256", secretBytes)
        .update(signedContent)
        .digest("base64");

      if (signature === expectedSignature) {
        validSignature = true;
        break;
      }
    }

    if (!validSignature) {
      this.logger.error("Webhook signature verification failed");
      throw new BadRequestException("Invalid webhook signature");
    }

    // Check timestamp to prevent replay attacks (5 minute tolerance)
    const timestamp = parseInt(svixTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes

    if (Math.abs(now - timestamp) > tolerance) {
      throw new BadRequestException("Webhook timestamp too old or too new");
    }
  }
}

