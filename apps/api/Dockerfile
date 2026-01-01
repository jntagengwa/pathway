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

# Fix ESM imports: Add .js extensions to relative file imports
# Note: Directory imports like "./dto" should work as-is in Node.js ESM (resolves to ./dto/index.js)
# We only add .js to imports that look like files (contain a / and a filename, or have an extension)
RUN find /app/apps/api/dist -name "*.js" -type f -exec sed -i.bak \
    -e 's/from "\(\.\.\?\/[^"]*\.[^"\/]*\)"/from "\1.js"/g' \
    -e 's/from "\(\.\.\?\/[^"]*\/[^"\/]*\)"/from "\1.js"/g' \
    -e 's/from '\''\(\.\.\?\/[^'\'']*\.[^'\''\/]*\)'\''/from '\''\1.js'\''/g' \
    -e 's/from '\''\(\.\.\?\/[^'\'']*\/[^'\''\/]*\)'\''/from '\''\1.js'\''/g' \
    {} \; && find /app/apps/api/dist -name "*.js.bak" -delete

# Runtime stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace structure needed for production install
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/packages ./packages

# Copy compiled dist output from builder (this is the critical fix)
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy package.json needed for pnpm install --filter to work
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy .pnpm store from builder to preserve all packages
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Install production dependencies - this will create proper symlinks from node_modules to .pnpm
# Use --ignore-scripts to skip prepare scripts like husky
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @pathway/api

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Change to the app directory so Node.js ESM module resolution works correctly
# TypeScript with rootDir: "../../" creates nested structure: dist/apps/api/src/main.js
WORKDIR /app/apps/api

# Use relative path from the package directory (package.json context is needed for ESM)
CMD ["node", "dist/apps/api/src/main.js"]

