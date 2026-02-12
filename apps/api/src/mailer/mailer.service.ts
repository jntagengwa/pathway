import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

type SendInviteEmailParams = {
  to: string;
  inviteUrl: string;
  orgName: string;
  invitedByName?: string;
};

/** Params for toolkit download link email. */
export type SendToolkitLinkParams = {
  to: string;
  name?: string;
  orgName?: string;
  downloadUrl: string;
};

/** Params for shift-assignment notification (staff asked to accept a class shift). */
export type SendShiftAssignmentParams = {
  to: string;
  staffName: string;
  sessionTitle: string;
  sessionStartsAt: string;
  acceptUrl: string;
  orgName?: string;
};

/** Params for parent signup complete – "Complete your account" / sign-in link. */
export type SendParentSignupCompleteParams = {
  to: string;
  parentName: string;
  siteName: string;
  orgName: string;
  loginUrl: string;
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
   * Send toolkit download link email.
   * In dev without RESEND_API_KEY, logs the download URL to console.
   */
  async sendToolkitLink(params: SendToolkitLinkParams): Promise<void> {
    const { to, name, orgName, downloadUrl } = params;

    this.logger.log(`[📧 MAILER] Sending toolkit link to ${to}`);
    const subject = "Your Nexsteps Attendance + Safeguarding Toolkit";
    const html = this.buildToolkitLinkHtml({ name, orgName, downloadUrl });
    const text = this.buildToolkitLinkText({ name, orgName, downloadUrl });

    if (!this.isEnabled || !this.resend) {
      this.logger.log(
        `[📧 MAILER] MOCK MODE - Would send toolkit link to ${to}\nSubject: ${subject}\nDownload URL: ${downloadUrl}`,
      );
      return;
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        this.logger.error(`[📧 MAILER] Toolkit link error:`, result.error);
        throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
      }

      this.logger.log(`[📧 MAILER] Toolkit link sent to ${to}`);
    } catch (error) {
      this.logger.error(`[📧 MAILER] Exception sending toolkit link to ${to}:`, error);
      throw new Error(`Failed to send toolkit link: ${String(error)}`);
    }
  }

  private buildToolkitLinkHtml(params: {
    name?: string;
    orgName?: string;
    downloadUrl: string;
  }): string {
    const { name, orgName, downloadUrl } = params;
    const greeting = name ? `Hi ${name},` : "Hi,";
    const orgLine = orgName ? ` for ${orgName}` : "";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Toolkit</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Nexsteps</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;">${greeting}</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #525252;">
                Here's your download link${orgLine} for the Attendance + Safeguarding Toolkit. The link expires in 48 hours.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 6px; background-color: #0066cc;">
                    <a href="${downloadUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Download Toolkit</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #737373;">
                If you didn't request this, you can safely ignore this email.
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

  private buildToolkitLinkText(params: {
    name?: string;
    orgName?: string;
    downloadUrl: string;
  }): string {
    const { name, orgName, downloadUrl } = params;
    const greeting = name ? `Hi ${name},` : "Hi,";
    const orgLine = orgName ? ` for ${orgName}` : "";

    return `
Nexsteps

${greeting}

Here's your download link${orgLine} for the Attendance + Safeguarding Toolkit. The link expires in 48 hours.

Download: ${downloadUrl}

If you didn't request this, you can safely ignore this email.
    `.trim();
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

  /**
   * Send an email asking staff to accept a class shift.
   * In the future this will be complemented by mobile push notifications.
   */
  async sendShiftAssignmentNotification(
    params: SendShiftAssignmentParams,
  ): Promise<void> {
    const { to, staffName, sessionTitle, sessionStartsAt, acceptUrl, orgName } =
      params;

    this.logger.log(
      `[📧 MAILER] Step 9: sendShiftAssignmentNotification called for to=${to}, sessionTitle=${sessionTitle}`,
    );

    const subject = `You've been assigned: ${sessionTitle} – please accept or decline`;
    const html = this.buildShiftAssignmentHtml({
      staffName,
      sessionTitle,
      sessionStartsAt,
      acceptUrl,
      orgName,
    });
    const text = this.buildShiftAssignmentText({
      staffName,
      sessionTitle,
      sessionStartsAt,
      acceptUrl,
      orgName,
    });

    this.logger.log(
      `[📧 MAILER] Step 10: isEnabled=${this.isEnabled}, resend=${!!this.resend}, fromAddress=${this.fromAddress ?? "(not set)"}`,
    );
    if (!this.isEnabled || !this.resend) {
      this.logger.log(
        `[📧 MAILER] Step 10b: MOCK MODE - not sending. Would send to ${to}, Subject: ${subject}, Accept: ${acceptUrl}`,
      );
      return;
    }

    this.logger.log(`[📧 MAILER] Step 11: Calling Resend API...`);
    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        this.logger.error(
          `[📧 MAILER] Step 12 FAIL: Resend API returned error:`,
          result.error,
        );
        throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
      }

      this.logger.log(`[📧 MAILER] Step 12: ✅ Shift assignment email sent to ${to}, id=${result.data?.id ?? "n/a"}`);
    } catch (error) {
      this.logger.error(
        `[📧 MAILER] Step 12 FAIL: Exception sending shift assignment to ${to}:`,
        error,
      );
      throw new Error(
        `Failed to send shift assignment email: ${String(error)}`,
      );
    }
  }

  private buildShiftAssignmentHtml(params: {
    staffName: string;
    sessionTitle: string;
    sessionStartsAt: string;
    acceptUrl: string;
    orgName?: string;
  }): string {
    const { staffName, sessionTitle, sessionStartsAt, acceptUrl, orgName } =
      params;
    const footer = orgName
      ? `This assignment was sent by ${orgName}.`
      : "If you didn't expect this, you can safely ignore this email.";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift assignment</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Nexsteps</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
                Hi ${staffName},
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #525252;">
                You've been assigned to the following session. Please accept or decline so the rota can be updated.
              </p>
              <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1a1a1a;">${sessionTitle}</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #737373;">${sessionStartsAt}</p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 6px; background-color: #0066cc;">
                    <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">View schedule &amp; respond</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #737373;">${footer}</p>
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

  private buildShiftAssignmentText(params: {
    staffName: string;
    sessionTitle: string;
    sessionStartsAt: string;
    acceptUrl: string;
    orgName?: string;
  }): string {
    const { staffName, sessionTitle, sessionStartsAt, acceptUrl, orgName } =
      params;
    const footer = orgName
      ? `This assignment was sent by ${orgName}.`
      : "If you didn't expect this, you can safely ignore this email.";

    return `
Nexsteps

Hi ${staffName},

You've been assigned to the following session. Please accept or decline so the rota can be updated.

${sessionTitle}
${sessionStartsAt}

View your schedule and respond: ${acceptUrl}

${footer}
    `.trim();
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

  /**
   * Send "Complete your account" email after parent signup (invite-only flow).
   * Contains link to app login so parent can sign in with Auth0.
   */
  async sendParentSignupCompleteEmail(
    params: SendParentSignupCompleteParams,
  ): Promise<void> {
    const { to, parentName, siteName, orgName, loginUrl } = params;

    this.logger.log(
      `[📧 MAILER] Sending parent signup complete email to ${to}`,
    );

    const subject = `Complete your ${siteName} account – sign in to Nexsteps`;
    const html = this.buildParentSignupCompleteHtml({
      parentName,
      siteName,
      orgName,
      loginUrl,
    });
    const text = this.buildParentSignupCompleteText({
      parentName,
      siteName,
      orgName,
      loginUrl,
    });

    if (!this.isEnabled || !this.resend) {
      this.logger.log(
        `[📧 MAILER] MOCK MODE - Would send parent signup complete to ${to}\nSubject: ${subject}\nLink: ${loginUrl}`,
      );
      return;
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        this.logger.error(
          `[📧 MAILER] Parent signup complete email error:`,
          result.error,
        );
        throw new Error(
          `Resend API error: ${JSON.stringify(result.error)}`,
        );
      }

      this.logger.log(
        `[📧 MAILER] Parent signup complete email sent to ${to}`,
      );
    } catch (error) {
      this.logger.error(
        `[📧 MAILER] Exception sending parent signup complete to ${to}:`,
        error,
      );
      throw new Error(
        `Failed to send parent signup complete email: ${String(error)}`,
      );
    }
  }

  private buildParentSignupCompleteHtml(params: {
    parentName: string;
    siteName: string;
    orgName: string;
    loginUrl: string;
  }): string {
    const { parentName, siteName, orgName, loginUrl } = params;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete your account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Nexsteps</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
                Hi ${parentName},
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #525252;">
                You've completed registration for ${siteName}. Use the link below to sign in to your account.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 6px; background-color: #0066cc;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Sign in</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #737373;">
                If you didn't register with ${orgName}, you can safely ignore this email.
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

  private buildParentSignupCompleteText(params: {
    parentName: string;
    siteName: string;
    orgName: string;
    loginUrl: string;
  }): string {
    const { parentName, siteName, orgName, loginUrl } = params;
    return `
Nexsteps

Hi ${parentName},

You've completed registration for ${siteName}. Sign in here:

${loginUrl}

If you didn't register with ${orgName}, you can safely ignore this email.
    `.trim();
  }
}

