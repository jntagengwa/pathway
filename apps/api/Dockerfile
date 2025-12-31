# Build stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies (install all to ensure workspace package deps are hoisted)
# Disable husky during docker build to avoid .git can't be found noise
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Copy .pnpm store from deps stage to reuse downloaded packages
# Then re-run pnpm install to recreate proper symlinks
# This is necessary because copying node_modules breaks symlinks
COPY --from=deps /app/node_modules/.pnpm ./node_modules/.pnpm

# Re-run pnpm install to recreate node_modules symlinks properly
# Using --prefer-offline to use existing .pnpm store, --frozen-lockfile for consistency
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --prefer-offline

# Build from workspace root using pnpm filter
# This ensures workspace binaries and dependencies are resolved correctly
ENV NODE_ENV=production
RUN pnpm --filter @pathway/api build

# Runtime stage  
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace structure
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Copy .pnpm store from builder to preserve all packages
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Install production dependencies - this will create proper symlinks from node_modules to .pnpm
# Use --ignore-scripts to skip prepare scripts like husky
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @pathway/api

# Run from the app directory
WORKDIR /app/apps/api

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "dist/src/main.js"]

