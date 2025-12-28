# PathWay Monorepo

## Project Overview

PathWay is a comprehensive monorepo project designed to streamline the development of a scalable and maintainable platform. This repository contains multiple applications and shared packages, enabling efficient code reuse and unified development workflows.

## Monorepo Structure

The repository is organized into the following main directories:

- **apps/**  
  Contains the main applications:
  - `api` - Backend API server
  - `admin` - Admin dashboard web application
  - `mobile` - Mobile application

- **packages/**  
  Contains shared libraries and utilities:
  - `db` - Database schema and migrations
  - `types` - Shared TypeScript types
  - `config` - Configuration utilities and environment management
  - `ui` - Shared UI components
  - `util` - Utility functions and helpers

## Tech Stack

- **Node.js** & **TypeScript** for backend and shared code
- **React** for web applications (`admin`)
- **React Native** for the `mobile` app
- **pnpm** as the package manager
- **Turborepo** for build orchestration and caching
- **Docker** for containerization
- **Jest** for testing
- **ESLint** and **Prettier** for linting and formatting

## Getting Started

### Prerequisites

- Node.js (>=16.x)
- pnpm (>=7.x)
- Docker (optional, for containerized development)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/pathway.git
cd pathway
pnpm install
```

## Development

To run all applications in development mode:

```bash
pnpm turbo run dev
```

Or run individual apps:

```bash
pnpm --filter=api dev
pnpm --filter=admin dev
pnpm --filter=mobile dev
```

## Testing

Run tests for all packages and apps:

```bash
pnpm turbo run test
```

Run tests for a specific package or app:

```bash
pnpm --filter=util test
```

## Linting & Formatting

To lint the entire repository:

```bash
pnpm turbo run lint
```

To format code:

```bash
pnpm turbo run format
```

## Environment Variables

Each app and package can have its own `.env` files. Make sure to create and configure the following environment files:

- `.env` - Base environment variables
- `.env.local` - Local overrides (should be gitignored)

Refer to the `.env.example` files in each directory for required variables.

### Local HTTPS for API (dev)
To run the Nest API over HTTPS on `https://api.localhost:3001` without browser certificate errors:

1) Add to your `/etc/hosts`:
   ```
   127.0.0.1 api.localhost
   ```
2) Generate local certs (requires [mkcert](https://github.com/FiloSottile/mkcert)):
   ```
   pnpm cert:api
   ```
   This writes:
   - `.cert/api.localhost.pem`
   - `.cert/api.localhost-key.pem`
3) In your `.env.local` (or `.env.example` for sharing defaults), set:
   ```
   API_DEV_SSL_CERT=.cert/api.localhost.pem
   API_DEV_SSL_KEY=.cert/api.localhost-key.pem
   API_HOST=api.localhost
   ```
4) Start the API; browse at `https://api.localhost:3001`.

## Docker Setup

### Production Docker Images

Each app has a production-ready Dockerfile optimized for AWS ECS Fargate deployments:

- `apps/web/Dockerfile` - Next.js SSR marketing site
- `apps/admin/Dockerfile` - Next.js SSR admin dashboard
- `apps/api/Dockerfile` - NestJS API server

All Dockerfiles use multi-stage builds with Node.js 20 Alpine images for minimal size.

#### Building Individual Images

Build each app's Docker image from the repository root:

```bash
# Build web app
docker build -f apps/web/Dockerfile -t pathway-web:latest .

# Build admin app
docker build -f apps/admin/Dockerfile -t pathway-admin:latest .

# Build API
docker build -f apps/api/Dockerfile -t pathway-api:latest .
```

#### Running Containers Locally

Start a single container:

```bash
# Run web app (exposes port 3001)
docker run -p 3001:3000 pathway-web:latest

# Run admin app (exposes port 3002)
docker run -p 3002:3000 pathway-admin:latest

# Run API (exposes port 3003)
docker run -p 3003:3001 pathway-api:latest
```

#### Docker Compose (Production Smoke Test)

Use the production docker-compose file for local testing:

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up --build

# Run in detached mode
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

Services will be available on:
- Web: http://localhost:3001
- Admin: http://localhost:3002
- API: http://localhost:3003

**Note:** The services run on an internal network but expose ports for local testing. For production deployments (e.g., AWS ECS), configure networking, environment variables, and service discovery according to your infrastructure requirements.

## CI/CD

This monorepo uses GitHub Actions for continuous integration. The CI pipeline runs on every push and pull request to `master` and `develop` branches.

### CI Commands

The CI workflow (`.github/workflows/ci.yml`) runs the following checks:

```bash
# Typecheck all packages and apps
pnpm -r typecheck

# Lint all packages and apps
pnpm -r lint

# Run tests for all packages and apps
pnpm -r test
```

All checks must pass before code can be merged. The workflow:
- Uses pnpm with frozen lockfile for reproducible installs
- Caches the pnpm store for faster builds
- Fails fast on the first error (typecheck → lint → test)
- Runs on Ubuntu latest with Node.js 20

### Local CI Checks

You can run the same checks locally before pushing:

```bash
# Typecheck
pnpm -r typecheck

# Lint
pnpm -r lint

# Test
pnpm -r test
```

Or use the root scripts (which use Turbo for caching):

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Next Steps

- Add more detailed documentation for each app and package
- Integrate Storybook for UI components in `ui` package
- Expand testing coverage and add end-to-end tests
- Optimize Docker images and deployment pipelines
- Explore adding GraphQL support to the `api` app

---

Thank you for contributing to PathWay! If you have questions, please open an issue or reach out to the maintainers.
