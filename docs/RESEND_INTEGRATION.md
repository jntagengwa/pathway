# Resend Email Integration Summary

## Overview

Implemented Resend transactional email service for Nexsteps invite system. Emails are sent automatically when invites are created or resent.

## Files Added

### API Layer (`apps/api/src/mailer/`)

1. **`mailer.service.ts`**
   - Main email service using Resend SDK
   - `sendInviteEmail()` - Sends branded HTML + text invite emails
   - Gracefully handles missing API key (logs instead of sending)
   - Professional email template with responsive design

2. **`mailer.module.ts`**
   - NestJS module exporting `MailerService`
   - Imports webhook controller

3. **`resend-webhook.controller.ts`**
   - Webhook endpoint: `POST /webhooks/resend`
   - Handles Resend events:
     - `email.sent` - Logged
     - `email.delivered` - Logged (ready for DB updates)
     - `email.bounced` - Logged as error (ready for invite revocation)
     - `email.complained` - Logged as error (ready for suppression)
     - `email.delivery_delayed` - Logged as warning
     - `email.opened`, `email.clicked` - Logged for analytics
   - Signature verification using Svix HMAC
   - Timestamp validation (5-minute tolerance)
   - Raw body parsing for signature verification

## Files Modified

### API

1. **`apps/api/src/invites/invites.service.ts`**
   - Injected `MailerService`
   - `createInvite()` now sends email after creating invite
   - `resendInvite()` now sends email with new token
   - Includes org name and inviter name in email
   - Non-blocking: invite creation succeeds even if email fails

2. **`apps/api/src/invites/invites.module.ts`**
   - Imports `MailerModule`

3. **`apps/api/src/app.module.ts`**
   - Added `MailerModule` to imports

4. **`apps/api/package.json`**
   - Added `resend` dependency

## Environment Variables

### Required

```bash
# Resend API Key (from https://resend.com dashboard)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# From address (must be from verified domain)
RESEND_FROM="Nexsteps <noreply@mail.nexsteps.dev>"

# Admin app URL (for invite links)
ADMIN_URL="https://admin.nexsteps.dev"
```

### Optional

```bash
# Webhook signature verification (recommended for production)
RESEND_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Email Template

### Subject
```
You've been invited to join {Org Name} on Nexsteps
```

### Features
- ✅ Responsive HTML design
- ✅ Plain text fallback
- ✅ Branded with "Nexsteps" header
- ✅ Clear call-to-action button
- ✅ Fallback URL for copy-paste
- ✅ Professional footer with context
- ✅ Inviter name attribution (when available)

### Example Email Content
```
{Inviter Name} has invited you to join {Org Name}

Click the button below to accept your invitation and get started with Nexsteps.

[Accept Invitation Button]

Or copy and paste this link into your browser:
https://admin.nexsteps.dev/accept-invite?token=...

This invitation was sent to you by {Org Name}.
If you didn't expect this invitation, you can safely ignore this email.
```

## Webhook Events

### Endpoint
```
POST /webhooks/resend
```

### Headers (Svix Signature)
```
svix-id: msg_xxxxxxxxxxxxx
svix-timestamp: 1234567890
svix-signature: v1,base64signature v1,base64signature2
```

### Event Payload Example
```json
{
  "type": "email.delivered",
  "created_at": "2024-12-24T10:00:00Z",
  "data": {
    "created_at": "2024-12-24T09:59:50Z",
    "email_id": "4ef9a417-02e9-4d09-a9f6-7f3b7e5d4c8a",
    "from": "Nexsteps <noreply@mail.nexsteps.dev>",
    "to": ["user@example.com"],
    "subject": "You've been invited to join Demo Org on Nexsteps"
  }
}
```

## Testing

### Development Mode (No API Key)
```bash
# Emails will be logged to console
unset RESEND_API_KEY
pnpm --filter @pathway/api dev

# Console output:
[MailerService] [MOCK EMAIL] Would send invite to user@example.com
Subject: You've been invited to join Demo Org on Nexsteps
Link: https://localhost:3000/accept-invite?token=abc123...
```

### With Real API Key
```bash
# Set up environment
export RESEND_API_KEY="re_xxx"
export RESEND_FROM="Nexsteps <your-verified@email.com>"
export ADMIN_URL="https://localhost:3000"

# Start API
pnpm --filter @pathway/api dev

# Create an invite via admin UI or API
curl -X POST https://api.localhost:3001/orgs/{orgId}/invites \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","orgRole":"ORG_MEMBER"}'

# Check email inbox
```

### Webhook Testing
```bash
# Use ngrok to expose local server
ngrok http 3001

# Add webhook endpoint in Resend dashboard:
https://xxx.ngrok.io/webhooks/resend

# Test webhook:
curl -X POST https://api.localhost:3001/webhooks/resend \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: v1,testsignature" \
  -d '{"type":"email.delivered","created_at":"2024-12-24T10:00:00Z","data":{"email_id":"test","from":"test@test.com","to":["user@example.com"],"subject":"Test"}}'
```

## Security Features

1. **Signature Verification**
   - HMAC-SHA256 signature validation
   - Prevents replay attacks (5-minute window)
   - Multiple signature support (Svix versioning)

2. **Graceful Degradation**
   - Missing API key → log mode (development friendly)
   - Email failure → invite still created (non-blocking)
   - Missing webhook secret → warning but accepts webhooks

3. **Rate Limiting** (TODO)
   - Consider adding rate limits for email sending
   - Resend has built-in rate limits per plan

## Future Enhancements

### Short Term
- [ ] Track email delivery status in Invite model
- [ ] Auto-revoke invites after bounce
- [ ] Email suppression list for complaints
- [ ] Retry logic for failed sends

### Long Term
- [ ] Email templates in database (customizable per org)
- [ ] Email analytics dashboard
- [ ] A/B testing for email content
- [ ] Scheduled email sending
- [ ] Batch invite emails
- [ ] Email preview in admin UI

## Resources

- Setup Guide: [`docs/EMAIL_SETUP.md`](./EMAIL_SETUP.md)
- Resend Docs: https://resend.com/docs
- Resend Node.js SDK: https://github.com/resend/resend-node
- Svix Webhook Docs: https://docs.svix.com/receiving/verifying-payloads/how

## Build Status

✅ API builds successfully with mailer module
✅ All TypeScript types resolved
✅ Resend SDK integrated
✅ Webhook endpoint ready for production

