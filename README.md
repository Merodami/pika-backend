# Pika - Modern Microservices Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![NX](https://img.shields.io/badge/NX-21.1.3-lightblue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.2-blue)
![Redis](https://img.shields.io/badge/Redis-7.2-red)

_A fitness platform built with modern microservices architecture, clean code principles, and developer-first experience._

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.x or higher
- **Yarn** 4.9.1+ (Yarn Berry/Modern Yarn)
- **Docker** and **Docker Compose**

### Installation & Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd pika
yarn install

# 2. Copy environment configuration
cp .env.local .env

# 3. Start infrastructure services (PostgreSQL + Redis)
yarn docker:local

# 4. Setup database and generate code
# This single command does everything:
#   - Generates Prisma client from database schema
#   - Builds core packages (@pika/types, @pika/environment)
#   - Generates OpenAPI specifications from Zod schemas
#   - Generates API documentation (Scalar docs)
#   - Runs database migrations
#   - Generates test database dump
yarn local:generate

# 5. Seed database with initial data
# Creates users with 20-200 sessions each for realistic testing
yarn db:seed

# 6. Build all packages
# This compiles TypeScript for all services and libraries
yarn build

# 7. Start all microservices in development mode
# Services will auto-reload on code changes
yarn local

# 8. (Optional) Generate test tokens for API testing
# Requires services to be running (step 7)
# Creates test-tokens.json with access tokens for different user roles
yarn tsx tools/api-testing/generate-test-tokens.ts
```

🎉 **That's it!** Your development environment is ready:

- **API Gateway**: http://127.0.0.1:5500
- **API Documentation**: http://127.0.0.1:5500/docs
- **Individual Services**: Ports 5501-5510 (see [Service Ports](#service-ports))

---

## 📁 Architecture Overview

Pika follows **Clean Architecture** principles with a **microservices** design orchestrated through **NX monorepo**:

```
packages/
├── services/              # Microservices (Clean Architecture)
│   ├── auth/             # Authentication & JWT management
│   ├── user/             # User profiles & management
│   ├── gym/              # Gym locations & equipment
│   ├── session/          # Workout sessions & booking
│   ├── payment/          # Billing & transactions
│   └── support/          # Help desk & problem reporting
├── shared/               # Cross-service utilities & errors
├── api/                 # OpenAPI specifications & schemas
├── api-gateway/         # Service orchestration & routing
├── database/            # Prisma schema & migrations
├── redis/               # Caching layer & decorators
├── http/                # Express server utilities
├── sdk/                 # Generated client & mappers
├── environment/         # Configuration management
├── types/               # Shared TypeScript definitions
└── tests/               # Integration test utilities
```

### Clean Architecture Layers

Each microservice follows the **Controller → Service → Repository** pattern:

- **Controllers**: Handle HTTP requests, parameter extraction, response formatting
- **Services**: Business logic, validation, orchestration between repositories
- **Repositories**: Data access layer, database operations, caching
- **Mappers**: Data transformation between database, domain, and API layers

---

## 🛠️ Development

### Essential Commands

```bash
# Development workflow
yarn local                  # Start all services in watch mode
yarn kill                  # Stop all running services

# Database operations
yarn db:migrate            # Run Prisma migrations
yarn db:seed               # Seed database with sample data
yarn db:generate           # Generate Prisma client

# API & SDK generation
yarn generate:api          # Generate OpenAPI specifications
yarn generate:sdk          # Generate SDK from OpenAPI specs
yarn generate:docs         # Generate API documentation (Scalar)

# Quality checks (recommended)
yarn check                 # Quick validation: typecheck + format + lint
yarn check:fix             # Auto-fix: format + lint:fix + typecheck
yarn pre-commit            # Full validation: format + lint + typecheck + build

# Building & validation (individual)
yarn build                 # Build all packages
yarn typecheck             # TypeScript type checking
yarn lint                  # ESLint + Prettier checks
yarn format                # Format all files with Prettier
yarn lint:fix              # Auto-fix linting issues

# Testing
yarn test                  # Run all tests with Vitest
yarn test:coverage         # Run tests with coverage report
yarn test:integration      # Integration tests only

# CI/CD (local testing)
yarn ci:local              # Run full CI pipeline locally with Act
yarn ci:validate           # Run validation job only
yarn ci:test               # Run test job only

# API Testing & Development
yarn tsx tools/api-testing/generate-test-tokens.ts   # Generate test tokens (requires running services)
# Output: test-tokens.json with tokens for different user roles:
#   - ADMIN, MEMBER, PROFESSIONAL, THERAPIST, CONTENT_CREATOR
# Note: For long-lasting tokens (1 year), set JWT_ACCESS_EXPIRY=365d in .env
```

### Service-Specific Development

```bash
# Start individual services
yarn nx run @pikauth:local
yarn nx run @pikaym:local
yarn nx run @pikaession:local

# Service-specific testing
yarn vitest packages/services/auth
yarn vitest packages/services/gym
```

### Service Ports

| Service               | Port | Description                      |
| --------------------- | ---- | -------------------------------- |
| API Gateway           | 5500 | Main entry point & documentation |
| User Service          | 5501 | User profiles & management       |
| Auth Service          | 5502 | Authentication & authorization   |
| Gym Service           | 5503 | Gym locations & equipment        |
| Session Service       | 5504 | Workout sessions & booking       |
| Payment Service       | 5505 | Billing & transactions           |
| Subscription Service  | 5506 | Subscription management          |
| Communication Service | 5507 | Email & notifications            |
| Support Service       | 5508 | Help desk & problem reporting    |
| Social Service        | 5509 | Social features                  |
| File Storage Service  | 5510 | File upload & management         |

### Infrastructure Services

| Service    | Port | Credentials                |
| ---------- | ---- | -------------------------- |
| PostgreSQL | 6436 | `postgres:postgres@pika|
| Redis      | 7381 | No authentication (dev)    |

---

## 🔧 Technology Stack

### Core Technologies

- **Runtime**: Node.js 22.x with ESM modules
- **Language**: TypeScript 5.8.3 (strict mode)
- **Framework**: Express 4.x with custom middleware
- **Database**: PostgreSQL 17.2 with Prisma 6.9.0 ORM
- **Caching**: Redis 7.2 with ioredis client
- **Monorepo**: NX 21.1.3 with Yarn 4.9.1 workspaces

### Development Tools

- **Build System**: esbuild 0.25.5 with tsc-alias path resolution
- **Testing**: Vitest 3.2.2 with Testcontainers 11.0.1
- **Code Quality**: ESLint 9.28.0, Prettier 3.5.3, Husky git hooks
- **Hot Reload**: tsx 4.19.4 for TypeScript execution
- **Process Management**: concurrently, fkill-cli for service orchestration

### Key Features

- **🏗️ Clean Architecture**: Strict separation of concerns across all services
- **🔒 Type Safety**: 100% TypeScript with strict configuration
- **⚡ Fast Builds**: 60% faster builds with esbuild and NX caching
- **🧪 Integration Testing**: Real PostgreSQL/Redis testing with Testcontainers
- **📊 Caching Strategy**: Two-tier caching (Redis + method-level decorators)
- **🛡️ Security**: JWT authentication, request validation, CORS protection
- **📖 Auto Documentation**: OpenAPI specs generated from code

---

## 🏛️ Microservices

### Auth Service (`@pikauth`)

- User registration & authentication
- JWT token management (access + refresh)
- Multi-strategy authentication (local, OAuth)
- Password security & validation

### User Service (`@pikaser`)

- User profile management
- Account preferences & settings
- User status & role management

### Gym Service (`@pikaym`)

- Gym location management
- Equipment & amenities tracking
- Gym availability & pricing
- Induction scheduling

### Session Service (`@pikaession`)

- Workout session booking & management
- Session scheduling with trainer assignment
- Waiting list functionality
- Session reviews & feedback
- Denormalized data storage for performance (gymName, trainerName)
- Support for 20-200 sessions per user history

### Payment Service (`@pikaayment`)

- Credit pack management
- Membership subscriptions
- Payment processing (Stripe integration)
- Promo codes & discounts

### Support Service (`@pikaupport`)

- Problem reporting system
- Help desk functionality
- Issue tracking & resolution

### Communication Service (`@pikaommunication`)

- Email & SMS notifications
- Template management system
- Multi-provider support (AWS SES, Resend, Console)
- Bulk email capabilities
- Communication history tracking
- In-app notifications

---

## 🧪 Testing Strategy

### Testing Philosophy

Pika emphasizes **integration testing** over unit testing for higher confidence:

```bash
# Integration tests with real services
yarn test:integration

# Run specific test files
yarn vitest packages/services/auth/src/test
yarn vitest packages/services/session/src/test
```

### Testing Features

- **Testcontainers**: Real PostgreSQL & Redis instances for testing
- **Test Database**: Isolated test data with automatic cleanup
- **Service Testing**: Full HTTP request/response cycle testing
- **Mock Services**: Temporary mocks for cross-service dependencies

---

## 📊 Database & Schema

### Prisma Schema Management

**⚠️ Important**: Never edit `packages/database/prisma/schema.prisma` directly!

Instead, modify source files and regenerate:

```bash
# Edit these files:
packages/database/prisma/base.prisma          # Base configuration
packages/database/prisma/enums.prisma         # Enum definitions
packages/database/prisma/models/*.prisma      # Individual models

# Then regenerate:
yarn db:generate                              # Compiles schema + generates client
yarn generate:api && yarn generate:sdk        # Regenerate API specs and SDK
yarn generate:docs                            # Regenerate documentation
```

### Database Operations

```bash
yarn db:migrate                # Apply pending migrations
yarn db:migrate:reset          # Reset database (destructive)
yarn db:seed                   # Populate with sample data

# ⚠️ IMPORTANT: After running migrations, regenerate test database dump
yarn db:generate-test-dump     # Must run after db:migrate to update test fixtures
```

---

## 🔧 Configuration

### Environment Variables

Pika uses a comprehensive `.env` file for configuration. Key sections:

```bash
# Core application
NODE_ENV=development
APP_NAME=Pika

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:6436/pika

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=7381

# Authentication
JWT_SECRET=your-secret-key
SKIP_AUTH=false

# Service ports
AUTH_SERVICE_PORT=5502
USER_SERVICE_PORT=5501
GYM_SERVICE_PORT=5503
# ... additional service ports
```

### Service Configuration

Each service is independently configurable through the `@pikanvironment` package:

- **Type-safe configuration** with validation
- **Environment-specific overrides** (development, test, production)
- **Centralized configuration management**

---

## 🚀 Deployment

### Building for Production

```bash
# Build all packages
yarn build

# Type checking
yarn typecheck

# Code quality validation
yarn lint
```

### Docker Support

Pika includes Docker Compose for local development:

```bash
# Start infrastructure
yarn docker:local

# Stop infrastructure
yarn docker:local:down

# Restart infrastructure
yarn docker:restart
```

---

## 📖 API Documentation

### OpenAPI Documentation

- **Live Documentation**: http://127.0.0.1:5500/docs
- **Interactive Testing**: Built-in Swagger UI
- **Schema Validation**: Automatic request/response validation
- **Type Generation**: Auto-generated TypeScript types

### API Structure

```bash
# Core API endpoints
GET  /health                    # Health check
GET  /metrics                   # Performance metrics

# Service-specific endpoints
POST /auth/login               # Authentication
GET  /users/profile            # User management
GET  /gyms                     # Gym listings
POST /sessions/book            # Session booking
GET  /payments/methods         # Payment management
```

---

## 🤝 Contributing

### Development Workflow

1. **Follow Clean Architecture**: Controllers → Services → Repositories
2. **Implement Mappers**: All services MUST implement data transformation mappers
3. **Write Integration Tests**: Test real service interactions
4. **Use TypeScript Strictly**: 100% type coverage required
5. **Follow Import Conventions**: Use `@pika` aliases for cross-package imports

### Code Style

```bash
# Auto-format code
yarn lint:fix

# Pre-commit hooks
# Husky automatically runs linting and formatting on commit
```

### Adding New Services

1. Create service directory: `packages/services/my-service/`
2. Follow existing service structure (controllers, services, repositories)
3. Implement data mappers for all transformations
4. Add integration tests
5. Update API gateway routing
6. Document API endpoints in OpenAPI specs
7. Run `yarn generate:api && yarn generate:sdk && yarn generate:docs` to regenerate specs and docs

---

## 🔍 Troubleshooting

### Common Issues

**Starting fresh (complete reset):**

```bash
yarn reset:codebase          # Reset NX cache, clear all build artifacts
yarn clear                   # Remove all node_modules and dist folders
yarn install                 # Reinstall dependencies
yarn docker:restart          # Restart infrastructure
yarn local:generate          # Generate code + run migrations + setup database
yarn db:seed                 # Seed database with initial data
yarn local                   # Start services
```

**Services won't start:**

```bash
yarn kill                     # Kill all processes
yarn docker:restart           # Restart infrastructure
yarn local:generate          # Generate code + run migrations + setup database
yarn db:seed                 # Seed database with initial data
yarn local                   # Start services
```

**Database connection issues:**

```bash
yarn docker:local            # Ensure PostgreSQL is running
yarn db:migrate              # Apply migrations
yarn db:generate-test-dump   # Regenerate test fixtures after migration
```

**Port conflicts:**

```bash
yarn kill                    # Free up all service ports
# Or kill specific ports:
yarn kill:backend            # Kill backend services (5501-5510)
```

**Build errors:**

```bash
yarn clear                   # Clear node_modules and dist
yarn install                 # Reinstall dependencies
yarn build                   # Rebuild everything
```

### Development Tips

- **Use NX Console**: Install NX VS Code extension for GUI task management
- **Service Logs**: Each service logs to console with structured output
- **Hot Reload**: Services automatically restart on file changes
- **Database Inspection**: Use any PostgreSQL client on port 6436

---

## 📚 Additional Resources

- **Architecture Documentation**: `CLAUDE.md` - Comprehensive development guide
- **Previous Architecture**: `previous-architecture/` - Legacy codebase reference
- **API Specifications**: `packages/api/src/` - OpenAPI schemas
- **Type Definitions**: `packages/types/src/` - Shared TypeScript types

---

## 📝 License

Pika platform - Internal development project.

---

<div align="center">

```bash
yarn install && yarn docker:local && yarn local:generate && yarn local
```

</div>
