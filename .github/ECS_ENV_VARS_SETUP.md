# ECS Environment Variables Setup via GitHub Actions

## Problem Statement

AWS ECS **replaces the entire task definition** on every deploy. This means:
- ❌ Environment variables manually set in the AWS Console are **wiped** on each deploy
- ❌ Manual configuration is not repeatable or version-controlled
- ❌ Production deployments become fragile and error-prone

## Solution

**Inject production environment variables at deploy time from GitHub Secrets** into the ECS task definition.

This ensures:
- ✅ Deployments are fully repeatable and deterministic
- ✅ Production secrets are stored securely in GitHub Secrets
- ✅ No manual AWS Console configuration required
- ✅ Infrastructure is reproducible and version-controlled

---

## How It Works

### Flow: GitHub Secrets → ECS Task Definition

```
┌─────────────────┐
│ GitHub Secrets  │  (secure storage of production env vars)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │  (workflow reads secrets, passes as env vars)
│   deploy.yml    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  jq command     │  (safely injects env vars into JSON task definition)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ECS Task Def    │  (registered with AWS containing all env vars)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ECS Service     │  (updated to use new task definition revision)
└─────────────────┘
```

---

## Changes Made to `.github/workflows/deploy.yml`

### Before
- Used `sed` to replace only image URI and IAM role ARNs
- No production environment variables injected
- Relied on manually configured ECS task env vars (which get overwritten)

### After
- Uses `jq` (JSON processor) for safe JSON manipulation
- Reads production secrets from `${{ secrets.* }}`
- Injects env vars into task definition at deploy time
- Each new task revision includes all required environment variables

### Key Changes by Service

#### 1. **Web App** (`nexsteps-web`)
Injects:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_ISSUER`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_BASE_URL`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_THIN_URL`
- `STRIPE_PRICE_MAP`

#### 2. **Admin App** (`nexsteps-admin`)
Injects:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_ISSUER`

#### 3. **API** (`nexsteps-api`)
Injects:
- `NODE_ENV`, `PORT`, `HOSTNAME`
- `DATABASE_URL`
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER`, `AUTH0_AUDIENCE`
- `INTERNAL_AUTH_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_BASE_URL`, `STRIPE_CANCEL_URL`, `STRIPE_PRICE_MAP`
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SNAPSHOT_URL`, `STRIPE_SUCCESS_URL`, `STRIPE_THIN_URL`
- `STRIPE_WEBHOOK_SECRET_SNAPSHOT`, `STRIPE_WEBHOOK_SECRET_THIN`
- `RESEND_API_KEY`, `RESEND_FROM`
- `RETENTION_ENABLED`
- `BILLING_PROVIDER` (e.g. `STRIPE`)

---

## Setup Instructions

### Step 1: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add each secret with its production value:

#### Web App
```
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=<generate-a-secret-32-chars>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
AUTH0_ISSUER=https://yourapp.eu.auth0.com
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_BASE_URL=https://buy.stripe.com
STRIPE_SUCCESS_URL=https://yourapp.com/billing/success
STRIPE_CANCEL_URL=https://yourapp.com/billing/cancel
STRIPE_THIN_URL=https://buy.stripe.com/thin_...
STRIPE_PRICE_MAP={"basic":"price_...","premium":"price_..."}
```

#### Admin App
```
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXTAUTH_URL=https://admin.yourapp.com
NEXTAUTH_SECRET=<generate-a-secret-32-chars>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
AUTH0_ISSUER=https://yourapp.eu.auth0.com
```

#### API
```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/pathway_prod?schema=app
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
AUTH0_ISSUER=https://yourapp.eu.auth0.com
AUTH0_AUDIENCE=https://api.yourapp.com
INTERNAL_AUTH_SECRET=<generate-a-secret-32-chars>
BILLING_PROVIDER=STRIPE
STRIPE_SECRET_KEY=sk_live_...
STRIPE_BASE_URL=https://buy.stripe.com
STRIPE_CANCEL_URL=https://yourapp.com/billing/cancel
STRIPE_PRICE_MAP={"STARTER_MONTHLY":"price_...","GROWTH_MONTHLY":"price_..."}
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SNAPSHOT_URL=...
STRIPE_SUCCESS_URL=https://yourapp.com/billing/success
STRIPE_THIN_URL=...
STRIPE_WEBHOOK_SECRET_SNAPSHOT=whsec_...
STRIPE_WEBHOOK_SECRET_THIN=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM=PathWay <noreply@yourapp.com>
RETENTION_ENABLED=true
```

### Step 2: Verify Workflow Permissions

Ensure the GitHub Actions workflow has:
- ✅ `id-token: write` (for AWS OIDC authentication)
- ✅ `contents: read` (for reading repository code)

These are already configured in the workflow.

### Step 3: Deploy

Push to `master` branch to trigger the deployment workflow:

```bash
git push origin master
```

The workflow will:
1. Build Docker images for web, admin, and api
2. Push images to ECR
3. Render task definitions with injected env vars from GitHub Secrets
4. Register new task definition revisions in ECS
5. Update ECS services to use the new task definitions
6. Wait for services to stabilize

---

## Verification

### Check that env vars are injected

After deployment, verify the task definition contains your environment variables:

```bash
# For API
aws ecs describe-task-definition \
  --task-definition nexsteps-api \
  --region eu-west-2 \
  --query 'taskDefinition.containerDefinitions[0].environment' \
  --output table

# For Web
aws ecs describe-task-definition \
  --task-definition nexsteps-web \
  --region eu-west-2 \
  --query 'taskDefinition.containerDefinitions[0].environment' \
  --output table

# For Admin
aws ecs describe-task-definition \
  --task-definition nexsteps-admin \
  --region eu-west-2 \
  --query 'taskDefinition.containerDefinitions[0].environment' \
  --output table
```

You should see all the environment variables listed, including those from GitHub Secrets.

---

## Adding New Environment Variables

### 1. Add Secret to GitHub
Go to **Settings → Secrets and variables → Actions** and add the new secret.

### 2. Update Workflow
Edit `.github/workflows/deploy.yml` and add the secret to the relevant deploy step:

```yaml
- name: Render and deploy api task definition
  env:
    # ... existing vars ...
    NEW_SECRET_VAR: ${{ secrets.NEW_SECRET_VAR }}
  run: |
    # ... existing jq command ...
    jq --arg newVar "$NEW_SECRET_VAR" \
       # ... existing args ...
       '.containerDefinitions[0].environment += [
         # ... existing vars ...
         {"name": "NEW_SECRET_VAR", "value": $newVar}
       ]' \
       infra/ecs/api.taskdef.json > /tmp/api-taskdef.json
```

### 3. Deploy
Push to `master` to trigger deployment with the new variable.

---

## Best Practices

### ✅ DO
- Store all production secrets in GitHub Secrets
- Use descriptive secret names matching environment variable names
- Test changes in a staging environment first
- Rotate secrets regularly and update GitHub Secrets
- Use separate GitHub environments for production/staging if needed

### ❌ DON'T
- Hardcode secrets in workflow YAML or task definition JSON files
- Store secrets in repository files (even in `.env` files)
- Manually set environment variables in the AWS Console
- Commit sensitive values to version control

---

## Alternative: AWS Secrets Manager / SSM Parameter Store

For even better security, consider using AWS Secrets Manager or SSM Parameter Store:

1. Store secrets in AWS Secrets Manager
2. Reference them in the task definition using `secrets` instead of `environment`:

```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:eu-west-2:123456789:secret:prod/database-url"
    }
  ]
}
```

This requires:
- ECS task execution role to have permissions to read secrets
- Secrets stored in AWS Secrets Manager in the same region
- Potentially higher AWS costs (Secrets Manager charges per secret)

The current GitHub Secrets approach is simpler and sufficient for most use cases.

---

## Troubleshooting

### Issue: API doesn’t read Stripe (or other) env vars in prod

**All API env vars come from GitHub Secrets at deploy time.** The deploy workflow injects them into the ECS task definition. If a secret is **not set** in GitHub (or is under a different name), the task definition gets an **empty value** for that var, and the container will not see it.

**1. Check what the process actually sees**

Call the API’s env-check endpoint (no auth, no secrets returned):

```bash
curl -s https://your-api-domain/health/env
```

Example response:

```json
{
  "NODE_ENV": true,
  "BILLING_PROVIDER": true,
  "STRIPE_SECRET_KEY": true,
  "STRIPE_WEBHOOK_SECRET_SNAPSHOT": true,
  "STRIPE_PRICE_MAP": true,
  ...
}
```

If any of these are `false`, that var is **missing or empty** in the running container. Fix by adding or correcting the secret in **GitHub → Settings → Secrets and variables → Actions** (or in the **production** environment’s secrets if you use `environment: production`), then **redeploy**. Do not set these only in the AWS Console; the next deploy would overwrite the task definition with values from GitHub.

**2. Confirm secret names match exactly**

Names in GitHub must match what the workflow uses, e.g. `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MAP`, `BILLING_PROVIDER` (no typos, no extra spaces).

**3. If `/health/env` shows Stripe vars as `true` but pricing endpoint returns `pricing_unavailable`**

Use the **billing pricing diagnostics** endpoint (no auth, no secrets) to see where it fails and what the price map looks like (redacted):

```bash
curl -s https://your-api-domain/billing/prices/diagnostics
```

Response fields:
- **failurePoint**: `ok` | `no_stripe_client` | `no_price_map` — where pricing fails.
- **priceMapSet**, **priceMapRawLength**: whether `STRIPE_PRICE_MAP` is set and its length.
- **priceMapRawPreview**: first ~220 chars of the env value with Stripe price IDs redacted to `price_***` (safe for prod).
- **priceMapParseSuccess**, **priceMapParseError**: whether JSON parsed and the error if not (`unset`, `empty_after_trim`, `not_object`, `invalid_json`).
- **priceMapKeysExtracted**: keys we use from the map (e.g. `["STARTER_MONTHLY","GROWTH_MONTHLY"]`); empty if parse failed or no keys matched.

Also check **ECS/CloudWatch logs** for the API container. You should see one of:

- `pricing_unavailable: no_stripe_client` — Stripe client not created (e.g. `STRIPE_SECRET_KEY` empty at runtime).
- `pricing_unavailable: no_price_map` — `STRIPE_PRICE_MAP` failed to parse or is not a JSON object.
- `[billing] STRIPE_PRICE_MAP must be a JSON object...` — Value is set but not a JSON object (e.g. literal `true` or a string).
- `[billing] STRIPE_PRICE_MAP is set but invalid JSON...` — Value is not valid JSON (parse error).

**STRIPE_PRICE_MAP format:** Must be a **single-line JSON object** string. Keys must match the allowed price codes (or legacy names). Example:

```json
{"STARTER_MONTHLY":"price_xxx","STARTER_YEARLY":"price_yyy","GROWTH_MONTHLY":"price_zzz","GROWTH_YEARLY":"price_aaa","ENTERPRISE_CONTACT":"price_bbb","AV30_BLOCK_25_MONTHLY":"price_...","AV30_BLOCK_25_YEARLY":"price_...","AV30_BLOCK_50_MONTHLY":"price_...","AV30_BLOCK_50_YEARLY":"price_...","STORAGE_100GB_MONTHLY":"price_...","STORAGE_100GB_YEARLY":"price_...","STORAGE_200GB_MONTHLY":"price_...","STORAGE_200GB_YEARLY":"price_...","STORAGE_1TB_MONTHLY":"price_...","STORAGE_1TB_YEARLY":"price_...","SMS_1000_MONTHLY":"price_...","SMS_1000_YEARLY":"price_..."}
```

- Use **single-line** JSON in GitHub Secrets (no pretty-print; newlines can break injection).
- Allowed plan keys: `STARTER_MONTHLY`, `STARTER_YEARLY`, `GROWTH_MONTHLY`, `GROWTH_YEARLY`, `ENTERPRISE_CONTACT`.
- Allowed add-on keys: `AV30_BLOCK_25_MONTHLY`, `AV30_BLOCK_25_YEARLY`, `AV30_BLOCK_50_MONTHLY`, `AV30_BLOCK_50_YEARLY`, `STORAGE_100GB_*`, `STORAGE_200GB_*`, `STORAGE_1TB_*`, `SMS_1000_MONTHLY`, `SMS_1000_YEARLY`.
- Legacy keys (e.g. `STARTER_MONTH`, `ADDON_AV30_25_MONTH`) are mapped automatically; other keys are ignored.

Fix: Set **STRIPE_PRICE_MAP** in GitHub Secrets to a valid single-line JSON object with at least the plan keys you use, then redeploy.

---

### Issue: Secrets not showing up in running containers

**Check:**
1. GitHub Secrets are correctly named and set
2. Workflow completed successfully (check GitHub Actions logs)
3. New task definition revision was registered
4. ECS service was updated to use the new revision
5. Old tasks were replaced with new tasks

**Verify:**
```bash
# Check latest task definition revision
aws ecs describe-task-definition \
  --task-definition nexsteps-api \
  --region eu-west-2 \
  --query 'taskDefinition.revision'

# Check running tasks
aws ecs list-tasks \
  --cluster nexsteps-prod \
  --service-name nexsteps-api \
  --region eu-west-2

# Describe a specific task
aws ecs describe-tasks \
  --cluster nexsteps-prod \
  --tasks <task-arn> \
  --region eu-west-2
```

### Issue: Deployment fails with "Invalid JSON"

**Cause:** `jq` command syntax error or unescaped special characters

**Fix:**
- Check `jq` syntax in workflow
- Ensure all variables are properly quoted
- Test `jq` command locally with sample task definition

### Issue: Service won't stabilize

**Check:**
- CloudWatch Logs for the container (`/ecs/nexsteps-*`)
- ECS service events for error messages
- Application startup errors due to missing/incorrect env vars

**Verify environment variables:**
```bash
# SSH into a running container (if exec is enabled)
aws ecs execute-command \
  --cluster nexsteps-prod \
  --task <task-id> \
  --container nexsteps-api \
  --command "/bin/sh" \
  --interactive

# Then inside container:
env | grep -E "DATABASE_URL|AUTH0|STRIPE"
```

---

## Summary

This setup ensures:
- **Reproducible deployments**: All config is in code + GitHub Secrets
- **Security**: No secrets in repositories or AWS Console
- **Automation**: One push to `master` = full deployment with all env vars
- **Maintainability**: Clear workflow, easy to add/update variables

**No more manually configuring ECS environment variables that get overwritten!** 🎉
