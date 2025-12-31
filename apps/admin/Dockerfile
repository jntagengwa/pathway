# Build stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/admin ./apps/admin

# Install dependencies (install all to ensure workspace package deps are hoisted)
# Disable husky during docker build to avoid .git can't be found noise
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/admin ./apps/admin

# Copy entire node_modules structure from deps stage
# This includes .pnpm store and all symlinks
# Docker preserves symlinks when copying directories
COPY --from=deps /app/node_modules ./node_modules

# Build from the app directory using the full path to the binary
# pnpm stores binaries in workspace root's node_modules/.bin
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Change to app directory and run next build using full path to binary
WORKDIR /app/apps/admin
# Use full path to next binary from workspace root
RUN /app/node_modules/.bin/next build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output (Next.js preserves the app directory structure)
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone creates server.js in the app directory structure
# Note: With standalone output, we use node directly (not pnpm start) since the output is self-contained
CMD ["node", "apps/admin/server.js"]
