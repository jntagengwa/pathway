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

This monorepo uses a clear separation between **unit tests** and **integration tests**:

- **Unit tests** (`*.spec.ts`): Fast, isolated tests that don't require external dependencies like databases
- **Integration tests** (`*.e2e.spec.ts`, `*.e2e-spec.ts`): End-to-end tests that require a database and test the full application stack

### Running Tests

**Unit tests only (default, no database required):**

```bash
# Run all unit tests across the monorepo
pnpm test:unit

# Run unit tests for a specific package
pnpm --filter @pathway/api test:unit
pnpm --filter @pathway/workers test
pnpm --filter @pathway/auth test
```

**Integration tests (requires database):**

```bash
# Run all integration tests
pnpm test:integration

# Run integration tests for a specific package
pnpm --filter @pathway/api test:integration
```

**Note:** The default `pnpm test` command runs unit tests only, ensuring CI passes without external dependencies.

### Running Integration Tests Locally

Integration tests require a PostgreSQL database. You have two options:

#### Option 1: Using Docker Compose (Recommended)

1. Start the development database:

```bash
pnpm infra:up
```

2. Set up environment variables in `.env.test`:

```bash
DATABASE_URL=postgresql://pathway_user:pathway_password@localhost:5432/pathway_test?schema=app
E2E_DATABASE_URL=postgresql://pathway_user:pathway_password@localhost:5432/pathway_test_e2e?schema=app
E2E_ORG_ID=00000000-0000-0000-0000-000000000001
E2E_TENANT_ID=00000000-0000-0000-0000-000000000002
E2E_TENANT2_ID=00000000-0000-0000-0000-000000000003
E2E_TENANT_SLUG=e2e-tenant-a
```

3. Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm --filter @pathway/db run prisma migrate deploy
```

4. Run integration tests:

```bash
pnpm test:integration
```

#### Option 2: Using a Local Postgres Instance

1. Ensure PostgreSQL is running locally
2. Create test databases:

```sql
CREATE DATABASE pathway_test;
CREATE DATABASE pathway_test_e2e;
```

3. Configure `.env.test` with your local connection string
4. Run migrations and tests as above

### Test Naming Conventions

- **Unit tests**: `**/*.spec.ts` (e.g., `users.service.spec.ts`)
- **Integration tests**: `**/*.e2e.spec.ts` or `**/*.e2e-spec.ts` (e.g., `users.e2e.spec.ts`)

This convention allows Jest to automatically separate test types and run them independently.

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

# Run unit tests (no database required)
pnpm test:unit
```

All checks must pass before code can be merged. The workflow:
- Uses pnpm with frozen lockfile for reproducible installs
- Caches the pnpm store for faster builds
- Fails fast on the first error (typecheck → lint → test:unit)
- Runs on Ubuntu latest with Node.js 20
- **Does not require a database** - only unit tests run by default

### Integration Tests in CI

Integration tests run in a separate, optional job that:
- Runs on `master`/`main` branch pushes, PRs, or manual trigger
- Uses a Postgres service container (ephemeral, isolated per run)
- Sets up test databases and runs migrations automatically
- Runs all integration tests with proper database isolation

To manually trigger integration tests in CI, use the "Run workflow" button in GitHub Actions.

### Local CI Checks

You can run the same checks locally before pushing:

```bash
# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Unit tests (default, no DB required)
pnpm test:unit

# Integration tests (requires database)
pnpm test:integration
```

## Deployment

This repository includes automated deployment to AWS ECS Fargate via GitHub Actions. The deployment workflow runs automatically on pushes to the `master` branch.

### Required GitHub Variables

The following variables must be configured in your GitHub repository settings (Settings → Secrets and variables → Actions → Variables):

#### AWS Configuration
- `AWS_REGION` - AWS region (defaults to `eu-west-2` if not set)
- `AWS_ACCOUNT_ID` - Your AWS account ID
- `AWS_ROLE_TO_ASSUME` - ARN of the IAM role to assume via OIDC (e.g., `arn:aws:iam::123456789012:role/github-actions-role`)

#### ECS Configuration
- `ECS_CLUSTER` - ECS cluster name (defaults to `nexsteps-prod` if not set)
- `ECS_EXECUTION_ROLE_ARN` - ARN of the ECS task execution role (for pulling images from ECR and writing logs)
- `ECS_TASK_ROLE_ARN` - ARN of the ECS task role (for application permissions)

#### ECS Service Names
- `ECS_SERVICE_WEB` - ECS service name for web app (defaults to `nexsteps-web`)
- `ECS_SERVICE_ADMIN` - ECS service name for admin app (defaults to `nexsteps-admin`)
- `ECS_SERVICE_API` - ECS service name for API (defaults to `nexsteps-api`)

#### ECS Task Definition Names
- `ECS_TASKDEF_WEB` - Task definition family name for web (defaults to `nexsteps-web`)
- `ECS_TASKDEF_ADMIN` - Task definition family name for admin (defaults to `nexsteps-admin`)
- `ECS_TASKDEF_API` - Task definition family name for API (defaults to `nexsteps-api`)

#### ECR Repository Names
- `ECR_REPO_WEB` - ECR repository name for web (defaults to `nexsteps-web`)
- `ECR_REPO_ADMIN` - ECR repository name for admin (defaults to `nexsteps-admin`)
- `ECR_REPO_API` - ECR repository name for API (defaults to `nexsteps-api`)

### AWS IAM Setup

The deployment workflow uses OIDC to authenticate with AWS. You need to:

1. **Create an IAM Role** for GitHub Actions with trust policy allowing the GitHub OIDC provider:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
           }
         }
       }
     ]
   }
   ```

2. **Attach policies** to the role with permissions for:
   - ECR: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
   - ECS: `ecs:RegisterTaskDefinition`, `ecs:DescribeTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`
   - CloudWatch Logs: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

3. **Set the role ARN** as the `AWS_ROLE_TO_ASSUME` variable in GitHub.

### Deployment Process

When code is pushed to `master`:

1. The workflow builds Docker images for all three apps (web, admin, api)
2. Images are tagged with both `:sha-<commit-sha>` and `:latest`
3. Images are pushed to their respective ECR repositories
4. Task definitions are rendered with the new image URIs
5. New task definition revisions are registered with ECS
6. Each ECS service is updated to use the new task definition
7. The workflow waits for all services to reach a stable state

### Task Definitions

Task definitions are stored in `infra/ecs/` and include:
- Fargate compatibility
- CPU/Memory allocation (512 CPU, 1024 MB memory by default)
- Container port mappings (3000 for all services)
- CloudWatch Logs configuration
- Environment variables for production

You can modify these task definitions as needed, but ensure they match your ECS service configurations.

## Next Steps

- Add more detailed documentation for each app and package
- Integrate Storybook for UI components in `ui` package
- Expand testing coverage and add end-to-end tests
- Optimize Docker images and deployment pipelines
- Explore adding GraphQL support to the `api` app

---

Thank you for contributing to PathWay! If you have questions, please open an issue or reach out to the maintainers.
