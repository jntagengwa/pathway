import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

type SendInviteEmailParams = {
  to: string;
  inviteUrl: string;
  orgName: string;
  invitedByName?: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null = null;
  private readonly fromAddress: string;
  private readonly isEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.RESEND_FROM || "Nexsteps <noreply@mail.nexsteps.dev>";

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.isEnabled = true;
      this.logger.log("Resend email service initialized");
    } else {
      this.isEnabled = false;
      this.logger.warn(
        "RESEND_API_KEY not set - email sending disabled (emails will be logged only)",
      );
    }
  }

  /**
   * Send an invite email to a new user.
   * 
   * Note: This only sends the invitation link. Auth0 handles all email verification
   * for new accounts automatically.
   */
  async sendInviteEmail(params: SendInviteEmailParams): Promise<void> {
    const { to, inviteUrl, orgName, invitedByName } = params;

    this.logger.log(`[📧 MAILER] Starting to send invite email to ${to}`);
    this.logger.log(`[📧 MAILER] Config: { from: "${this.fromAddress}", enabled: ${this.isEnabled} }`);

    const subject = `You've been invited to join ${orgName} on Nexsteps`;
    const html = this.buildInviteEmailHtml({
      inviteUrl,
      orgName,
      invitedByName,
    });
    const text = this.buildInviteEmailText({
      inviteUrl,
      orgName,
      invitedByName,
    });

    if (!this.isEnabled || !this.resend) {
      this.logger.log(
        `[📧 MAILER] MOCK MODE - Would send invite to ${to}\nSubject: ${subject}\nLink: ${inviteUrl}`,
      );
      return;
    }

    try {
      this.logger.log(`[📧 MAILER] Calling Resend API...`);
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        this.logger.error(`[📧 MAILER] ❌ Resend API returned error:`, result.error);
        throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
      }

      this.logger.log(`[📧 MAILER] ✅ Email sent successfully to ${to}`);
      this.logger.log(`[📧 MAILER] Resend Email ID: ${result.data?.id}`);
    } catch (error) {
      this.logger.error(`[📧 MAILER] ❌ Exception while sending email to ${to}:`, error);
      throw new Error(`Failed to send invite email: ${String(error)}`);
    }
  }

  private buildInviteEmailHtml(params: {
    inviteUrl: string;
    orgName: string;
    invitedByName?: string;
  }): string {
    const { inviteUrl, orgName, invitedByName } = params;
    const invitedBy = invitedByName
      ? `${invitedByName} has invited you`
      : "You've been invited";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Nexsteps</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
                ${invitedBy} to join ${orgName}
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #525252;">
                Click the button below to accept your invitation and get started with Nexsteps.
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 6px; background-color: #0066cc;">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.5; color: #737373;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #0066cc; word-break: break-all;">
                ${inviteUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a3a3a3;">
                This invitation was sent to you by ${orgName}.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildInviteEmailText(params: {
    inviteUrl: string;
    orgName: string;
    invitedByName?: string;
  }): string {
    const { inviteUrl, orgName, invitedByName } = params;
    const invitedBy = invitedByName
      ? `${invitedByName} has invited you`
      : "You've been invited";

    return `
Nexsteps

${invitedBy} to join ${orgName}

Click the link below to accept your invitation and get started:

${inviteUrl}

If you didn't expect this invitation, you can safely ignore this email.
    `.trim();
  }
}

