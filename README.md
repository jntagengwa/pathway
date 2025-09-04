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

## Docker Setup

Build and run the Docker containers for production or development:

```bash
docker-compose up --build
```

Individual Dockerfiles are located in each app directory for custom container builds.

## CI/CD

This monorepo uses GitHub Actions for continuous integration and deployment. The pipeline includes:

- Dependency installation
- Linting and formatting checks
- Running tests
- Building apps and packages
- Deploying to staging/production environments

## Next Steps

- Add more detailed documentation for each app and package
- Integrate Storybook for UI components in `ui` package
- Expand testing coverage and add end-to-end tests
- Optimize Docker images and deployment pipelines
- Explore adding GraphQL support to the `api` app

---

Thank you for contributing to PathWay! If you have questions, please open an issue or reach out to the maintainers.
