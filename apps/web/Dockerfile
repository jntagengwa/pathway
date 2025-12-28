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
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

# Copy node_modules from deps stage (includes all workspace dependencies and hoisted deps)
COPY --from=deps /app/node_modules ./node_modules

# Build the app
WORKDIR /app/apps/web
RUN pnpm build

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
CMD ["node", "apps/web/server.js"]

