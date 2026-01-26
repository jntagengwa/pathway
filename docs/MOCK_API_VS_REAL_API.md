# Mock API vs Real API: Configuration Guide

## Overview

The PathWay admin app supports two modes of operation:
1. **Real API Mode**: Connects to the live backend API (production/staging)
2. **Mock API Mode**: Uses local mock data for development (fallback when API URL is not configured)

## How the Decision is Made

The decision between mock and real API is determined by the `isUsingMockApi()` function in `apps/admin/lib/api-client.ts`:

```typescript
const isUsingMockApi = (): boolean => {
  return (
    !process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_BASE_URL
  );
};
```

**Mock mode is enabled when:**
- `NEXT_PUBLIC_API_URL` is **not set** AND
- `NEXT_PUBLIC_API_BASE_URL` is **not set**

**Real API mode is enabled when:**
- Either `NEXT_PUBLIC_API_URL` OR `NEXT_PUBLIC_API_BASE_URL` is set

## Critical: Next.js Build-Time Embedding

⚠️ **IMPORTANT**: Next.js embeds `NEXT_PUBLIC_*` environment variables **at build time** into the JavaScript bundle. This means:

- The variable must be available **during the Docker build**, not just at runtime
- If the variable is missing at build time, the code will be compiled with mock mode
- Setting the variable only at runtime (e.g., in ECS task definition) is **too late**

## Production Deployment Requirements

### 1. Docker Build Stage

The `NEXT_PUBLIC_API_URL` must be passed as a **build argument** during the Docker build:

```dockerfile
# In apps/admin/Dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

### 2. GitHub Actions Deploy Workflow

The deploy workflow must pass the build argument:

```yaml
- name: Build and push admin image
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
  run: |
    docker buildx build \
      --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
      ...
```

### 3. ECS Task Definition (Runtime)

The variable should also be set in the ECS task definition for server-side runtime access:

```json
{
  "environment": [
    {
      "name": "NEXT_PUBLIC_API_URL",
      "value": "https://api.nexsteps.dev"
    }
  ]
}
```

**Note**: While the runtime setting doesn't affect client-side code (already embedded), it's still useful for server-side rendering and consistency.

## Development Setup

For local development, set the variable in your `.env.local` or `.env` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

If not set, the app will use mock mode automatically (convenient for frontend-only development).

## Troubleshooting

### Production is using mock API

**Symptoms:**
- Admin app shows "Running in mock API mode" banner
- Data appears to be sample/mock data
- API calls are not reaching the backend

**Causes:**
1. `NEXT_PUBLIC_API_URL` not set during Docker build
2. Build argument not passed in deploy workflow
3. GitHub Secret `NEXT_PUBLIC_API_URL` is missing or empty

**Solution:**
1. Verify the GitHub Secret `NEXT_PUBLIC_API_URL` is set to `https://api.nexsteps.dev`
2. Ensure the deploy workflow passes `--build-arg NEXT_PUBLIC_API_URL`
3. Rebuild and redeploy the admin image

### Verifying the Fix

After deploying, check the built image:

```bash
# Inspect the environment variables in the built image
docker run --rm <image> env | grep NEXT_PUBLIC_API_URL
```

Or check the browser's Network tab - API calls should go to `https://api.nexsteps.dev` instead of returning mock data.

## Related Files

- `apps/admin/lib/api-client.ts` - Mock API detection logic
- `apps/admin/Dockerfile` - Build-time configuration
- `.github/workflows/deploy.yml` - Deployment configuration
- `infra/ecs/admin.taskdef.json` - Runtime configuration
