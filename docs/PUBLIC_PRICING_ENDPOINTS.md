# Public Pricing Endpoints

The following endpoints have been made public (no authentication required) to support the marketing website and public buy-now flow.

## Public Endpoints

### 1. `/billing/prices` (GET)
- **Purpose**: Fetch current Stripe prices for all plans
- **Used by**: Marketing pricing page, buy-now page
- **Returns**: List of prices with codes, amounts, intervals
- **Authentication**: None (public)

### 2. `/billing/plan-preview` (POST)
- **Purpose**: Preview plan entitlements with add-ons
- **Used by**: Buy-now page to show caps and limits
- **Returns**: Plan preview with effective caps
- **Authentication**: None (public)

### 3. `/billing/buy-now/checkout` (POST)
- **Purpose**: Create checkout session for new customers
- **Used by**: Buy-now page to start purchase flow
- **Returns**: Stripe checkout session URL
- **Authentication**: None (public)
- **Behavior**: Creates org and tenant automatically for new purchases

## Plan Code Mapping

The frontend uses `CORE_MONTHLY` and `CORE_YEARLY`, but Stripe uses `MINIMUM_MONTHLY` and `MINIMUM_YEARLY`.

Mapping is handled automatically in:
- **Backend**: `buy-now.service.ts` and `plan-preview.service.ts` normalize CORE_* to MINIMUM_*
- **Frontend**: `buy-now-pricing.ts` maps MINIMUM_* back to CORE_* for display

## Stripe Price Map

In your `STRIPE_PRICE_MAP` environment variable, use the Stripe convention:

```json
{
  "MINIMUM_MONTHLY": "price_1234567890",
  "MINIMUM_YEARLY": "price_0987654321",
  "STARTER_MONTHLY": "price_abc123",
  "STARTER_YEARLY": "price_def456",
  "GROWTH_MONTHLY": "price_ghi789",
  "GROWTH_YEARLY": "price_jkl012"
}
```

## New Org Creation (Public Buy-Now)

When an unauthenticated user purchases:
1. User fills out org details (name, contact email, contact name)
2. Backend creates org and initial tenant automatically
3. Pending order is created
4. Stripe checkout session is created
5. User completes payment
6. Webhook updates subscription and entitlements

## Security Notes

- Pricing data is public (not sensitive)
- Plan preview is public (no customer data)
- Buy-now checkout requires valid email and org name
- No authentication bypass for protected endpoints (billing/entitlements, etc.)
