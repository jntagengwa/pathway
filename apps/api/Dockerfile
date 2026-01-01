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

# Note: We use tsx at runtime which handles ESM imports more leniently than plain Node.js
# tsx can resolve imports without explicit .js extensions, so we don't need to modify the compiled code

# Runtime stage
FROM base AS runner
WORKDIR /app

# Don't set NODE_ENV=production yet - we need devDependencies (tsx) to be installed
# We'll set it after install

# Copy workspace structure needed for install
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/packages ./packages

# Copy compiled dist output from builder (this is the critical fix)
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy package.json and tsconfig.json needed for pnpm install and tsx to work
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/tsconfig.json ./apps/api/tsconfig.json

# Copy .pnpm store from builder (contains all downloaded packages)
# Then reinstall to recreate node_modules with proper symlinks
# We need all deps (not just prod) because workspace packages point to .ts files and need tsx
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Reinstall all dependencies (including dev) using existing .pnpm store
# We need all deps because workspace packages point to .ts files and need tsx (devDep)
# Use --ignore-scripts to skip prepare scripts like husky
RUN pnpm install --frozen-lockfile --ignore-scripts

# Now set NODE_ENV for runtime
ENV NODE_ENV=production

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Change to API directory and use pnpm exec to find tsx
WORKDIR /app/apps/api

# Use tsx to run the compiled code - this allows workspace packages (@pathway/*) to resolve correctly
# since their package.json points to src/index.ts and tsx can handle TypeScript
# Note: The API code is compiled JS, but workspace packages are still TypeScript
# Pass --tsconfig so tsx knows about decorator settings when compiling workspace packages
CMD ["pnpm", "exec", "tsx", "--tsconfig", "tsconfig.json", "dist/apps/api/src/main.js"]

