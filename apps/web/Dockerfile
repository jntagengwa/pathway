# Build stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies (install all to ensure workspace package deps are hoisted)
# Disable husky during docker build to avoid .git can't be found noise
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

# Copy .pnpm store from deps stage (contains actual packages)
# Then re-run pnpm install to recreate symlinks properly
# This ensures workspace symlinks are correctly established
COPY --from=deps /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Re-link dependencies to recreate symlinks in node_modules
# This is necessary because copying node_modules can break symlinks
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --offline

# Build from repo root using pnpm filter
# pnpm --filter runs the command in the package directory but resolves dependencies from workspace root
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @pathway/web build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output (Next.js preserves the app directory structure)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone creates server.js in the app directory structure
# Note: With standalone output, we use node directly (not pnpm start) since the output is self-contained
CMD ["node", "apps/web/server.js"]
