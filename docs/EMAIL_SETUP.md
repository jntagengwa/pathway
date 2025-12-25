# Email Setup with Resend

Nexsteps uses [Resend](https://resend.com) for transactional email delivery, including invite emails.

## Setup Instructions

### 1. Create a Resend Account

1. Go to https://resend.com and sign up for an account
2. Verify your email address

### 2. Verify Your Domain

To send emails from your custom domain (e.g., `noreply@mail.nexsteps.dev`), you need to verify domain ownership:

1. In the Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `mail.nexsteps.dev`)
4. Add the provided DNS records to your domain:
   - **SPF record**: Add a TXT record for SPF authentication
   - **DKIM records**: Add 3 CNAME records for DKIM signing
   - **DMARC record** (optional but recommended): Add a TXT record for DMARC policy

Example DNS records:
```
# SPF (TXT record)
mail.nexsteps.dev    TXT    v=spf1 include:_spf.resend.com ~all

# DKIM (CNAME records - example)
resend._domainkey.mail.nexsteps.dev    CNAME    resend._domainkey.resend.com
resend1._domainkey.mail.nexsteps.dev   CNAME    resend1._domainkey.resend.com
resend2._domainkey.mail.nexsteps.dev   CNAME    resend2._domainkey.resend.com

# DMARC (TXT record - optional)
_dmarc.mail.nexsteps.dev    TXT    v=DMARC1; p=none; rua=mailto:dmarc@nexsteps.dev
```

5. Wait for DNS propagation (can take up to 48 hours, usually much faster)
6. Click **Verify** in the Resend dashboard

**Note:** For development, you can use Resend's test domain or verify your personal email address instead.

### 3. Create an API Key

1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Nexsteps Production" or "Nexsteps Development")
4. Select permissions:
   - **Sending access**: `Full access` or `Sending emails`
   - **Domain**: Select your verified domain
5. Copy the API key (starts with `re_`)

### 4. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Resend Email Service
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM="Nexsteps <noreply@mail.nexsteps.dev>"

# Admin URL (used for invite links)
ADMIN_URL="https://admin.nexsteps.dev"  # Production
# ADMIN_URL="https://localhost:3000"     # Development
```

### 5. Set Up Webhooks (Optional but Recommended)

Webhooks allow you to track email delivery, bounces, and complaints:

1. In the Resend dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL:
   - Production: `https://api.nexsteps.dev/webhooks/resend`
   - Development: Use a service like [ngrok](https://ngrok.com) to expose your local server
4. Select events to subscribe to:
   - ✅ `email.sent` - Email accepted by Resend
   - ✅ `email.delivered` - Email delivered to recipient's server
   - ✅ `email.delivery_delayed` - Temporary delivery failure
   - ✅ `email.bounced` - Permanent delivery failure
   - ✅ `email.complained` - Recipient marked as spam
   - ☐ `email.opened` - Recipient opened the email (optional)
   - ☐ `email.clicked` - Recipient clicked a link (optional)
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add to your `.env`:
   ```bash
   RESEND_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

## Testing Email Delivery

### Development Mode

If `RESEND_API_KEY` is not set, the mailer service will log emails to the console instead of sending them:

```
[MailerService] [MOCK EMAIL] Would send invite to user@example.com
Subject: You've been invited to join Demo Org on Nexsteps
Link: https://localhost:3000/accept-invite?token=abc123...
```

### Test with Real Emails

1. Set `RESEND_API_KEY` in your `.env`
2. Use your verified email or domain for `RESEND_FROM`
3. Create a test invite via the People page
4. Check your email inbox

## Email Templates

Invite emails include:
- **Subject**: "You've been invited to join {Org Name} on Nexsteps"
- **Responsive HTML template** with branded design
- **Plain text fallback** for email clients that don't support HTML
- **Accept invitation button** with direct link
- **Footer** with sender information

## Troubleshooting

### Emails Not Sending

1. **Check API key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check domain verification**: Go to Resend dashboard → Domains
3. **Check from address**: Must match a verified domain or email
4. **Check logs**: API server logs will show errors

### Emails Going to Spam

1. **Verify SPF record**: Sender Policy Framework authentication
2. **Verify DKIM records**: DomainKeys Identified Mail signing
3. **Add DMARC policy**: Domain-based Message Authentication
4. **Test with Mail Tester**: https://www.mail-tester.com
5. **Warm up domain**: Start with low volume, gradually increase

### Webhook Signature Verification Failing

1. **Check secret**: Ensure `RESEND_WEBHOOK_SECRET` matches dashboard
2. **Check raw body**: Webhooks require raw request body for signing
3. **Check timestamp**: Replays older than 5 minutes are rejected

## Production Checklist

- [ ] Domain verified with SPF, DKIM, and DMARC records
- [ ] Production API key created with appropriate permissions
- [ ] `RESEND_FROM` uses verified domain
- [ ] `ADMIN_URL` points to production admin app
- [ ] Webhook endpoint configured and tested
- [ ] `RESEND_WEBHOOK_SECRET` set for signature verification
- [ ] Email templates tested with various email clients
- [ ] Bounce and complaint handling implemented

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Email Best Practices](https://resend.com/docs/send-with-nodejs)
- [Resend Webhooks Guide](https://resend.com/docs/webhooks)
- [SPF Record Checker](https://mxtoolbox.com/spf.aspx)
- [DKIM Record Checker](https://mxtoolbox.com/dkim.aspx)
- [DMARC Record Checker](https://mxtoolbox.com/dmarc.aspx)

