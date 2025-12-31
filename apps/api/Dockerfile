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

# Copy workspace files and dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Build the app
# Disable husky during docker build
ENV HUSKY=0
WORKDIR /app/apps/api
RUN pnpm build

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

