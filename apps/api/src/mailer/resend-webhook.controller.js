var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ResendWebhookController_1;
import { Controller, Post, Body, Headers, BadRequestException, Logger, Req, } from "@nestjs/common";
import { createHmac } from "crypto";
let ResendWebhookController = ResendWebhookController_1 = class ResendWebhookController {
    logger = new Logger(ResendWebhookController_1.name);
    webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    async handleWebhook(req, svixId, svixTimestamp, svixSignature, body) {
        // Verify webhook signature if secret is configured
        if (this.webhookSecret) {
            this.verifyWebhookSignature(req.rawBody?.toString() || JSON.stringify(body), svixId, svixTimestamp, svixSignature);
        }
        else {
            this.logger.warn("RESEND_WEBHOOK_SECRET not set - webhook signature verification skipped");
        }
        // Handle different event types
        switch (body.type) {
            case "email.sent":
                this.logger.log(`Email sent: ${body.data.email_id} to ${body.data.to.join(", ")}`);
                break;
            case "email.delivered":
                this.logger.log(`Email delivered: ${body.data.email_id} to ${body.data.to.join(", ")}`);
                // TODO: Update invite record with delivery confirmation
                break;
            case "email.delivery_delayed":
                this.logger.warn(`Email delivery delayed: ${body.data.email_id} to ${body.data.to.join(", ")}`);
                break;
            case "email.bounced":
                this.logger.error(`Email bounced: ${body.data.email_id} to ${body.data.to.join(", ")}`);
                // TODO: Mark invite as bounced, possibly revoke it
                break;
            case "email.complained":
                this.logger.error(`Spam complaint: ${body.data.email_id} to ${body.data.to.join(", ")}`);
                // TODO: Handle spam complaint - may need to add email to suppression list
                break;
            case "email.opened":
                this.logger.debug(`Email opened: ${body.data.email_id} by ${body.data.to.join(", ")}`);
                break;
            case "email.clicked":
                this.logger.debug(`Email link clicked: ${body.data.email_id} by ${body.data.to.join(", ")}`);
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
    verifyWebhookSignature(rawBody, svixId, svixTimestamp, svixSignature) {
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
};
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Headers("svix-id")),
    __param(2, Headers("svix-timestamp")),
    __param(3, Headers("svix-signature")),
    __param(4, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ResendWebhookController.prototype, "handleWebhook", null);
ResendWebhookController = ResendWebhookController_1 = __decorate([
    Controller("webhooks/resend")
], ResendWebhookController);
export { ResendWebhookController };
