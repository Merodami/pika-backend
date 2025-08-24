# 🏢 The VoucherBook Backend - Enterprise Microservices Platform

<div align="center">
  
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NX-21.1.3-143055?style=for-the-badge&logo=nx&logoColor=white" alt="NX">
  <img src="https://img.shields.io/badge/PostgreSQL-17.2-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Prisma-6.9.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  
  <br />
  <br />
  
  <h3>🚀 A comprehensive enterprise platform built with modern microservices architecture</h3>
  
  <p align="center">
    <strong>Clean Architecture</strong> • <strong>Type-Safe</strong> • <strong>Production Ready</strong> • <strong>Self-Documenting APIs</strong>
  </p>

  <p align="center">
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-architecture-overview">Architecture</a> •
    <a href="#-microservices-architecture">Services</a> •
    <a href="#-api-documentation">Documentation</a> •
    <a href="#-license">License</a>
  </p>

  <br />

⚠️ **IMPORTANT**: Commercial use requires a license. See <a href="#-license">License section</a> for details.

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
cd thevoucherbook-backend
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

## ✨ Key Features

<table>
<tr>
<td>

### 🏗️ Architecture

- **Clean Architecture** with strict separation of concerns
- **Microservices** with independent deployment
- **Event-driven** communication patterns
- **Domain-driven design** principles

</td>
<td>

### 🔒 Security

- **JWT Authentication** with RS256 signing
- **Role-based access control** (RBAC)
- **API Key** authentication for services
- **Input validation** with Zod schemas

</td>
</tr>
<tr>
<td>

### ⚡ Performance

- **Redis caching** at multiple layers
- **Connection pooling** for databases
- **Optimized builds** with esbuild
- **Lazy loading** and code splitting

</td>
<td>

### 🧪 Quality

- **100% TypeScript** with strict mode
- **Integration-first** testing approach
- **Automated** code quality checks
- **Self-documenting** OpenAPI specs

</td>
</tr>
</table>

---

## 🏗️ Architecture Overview

The VoucherBook is built on **Clean Architecture** principles with a **microservices** design orchestrated through **NX monorepo**. The platform features enterprise-grade patterns including three-tier API design, comprehensive caching strategies, and production-ready deployment patterns.

### 📦 Package Organization

```
packages/
├── services/              # 🎯 Microservices (Clean Architecture)
│   ├── business/         # 🏪 Business directory & management
│   ├── category/         # 📂 Hierarchical category system
│   ├── user/             # 👤 User profiles & management
│   └── pdf/              # 📄 PDF generation & documents
├── infrastructure/        # 🔧 Core Infrastructure
│   ├── api-gateway/      # 🌐 Service orchestration & routing
│   ├── database/         # 🗃️ Multi-schema PostgreSQL with PostGIS
│   ├── redis/            # 🔴 High-performance caching layer
│   └── http/             # ⚡ Express.js framework foundation
├── application/           # 📱 Application Layer
│   ├── api/              # 📋 OpenAPI 3.1 specifications & schemas
│   ├── sdk/              # 🛠️ Generated client SDKs & mappers
│   └── auth/             # 🔐 JWT authentication framework
├── domain/                # 🧠 Domain Layer
│   ├── shared/           # 🤝 Cross-service utilities & errors
│   ├── types/            # 📝 Centralized type system
│   └── environment/      # ⚙️ Configuration management
├── testing/               # 🧪 Testing Infrastructure
│   ├── tests/            # Integration test utilities
│   └── deployment/       # 🚀 Platform deployment adapters
└── localization/          # 🌐 Internationalization
    └── translation/       # Multi-language support system
```

### 🎯 Clean Architecture Implementation

Each microservice strictly follows the **Controller → Service → Repository** pattern with comprehensive data mapping:

- **🎮 Controllers**: HTTP request handling, parameter extraction, response formatting
- **⚙️ Services**: Business logic, validation, cross-service orchestration
- **📊 Repositories**: Data access layer, database operations, caching integration
- **🔄 Mappers**: Data transformation between database, domain, and API layers
- **📝 DTOs**: Type-safe data transfer objects with Zod validation

### 🌐 Three-Tier API Design

The platform implements a sophisticated three-tier API architecture:

- **🌍 Public API**: Customer-facing endpoints with public access
- **👑 Admin API**: Administrative operations with role-based access
- **🔒 Internal API**: Service-to-service communication with API key authentication

### 📊 Multi-Schema Database Architecture

PostgreSQL implementation with logical separation:

- **13 Logical Schemas**: Domain-driven database organization
- **PostGIS Extensions**: Geospatial features for location-based services
- **Prisma ORM**: Type-safe database operations with code generation
- **Migration System**: Version-controlled schema evolution

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

| Service              | Port | Description                         |
| -------------------- | ---- | ----------------------------------- |
| **API Gateway**      | 5500 | 🌐 Main entry point & documentation |
| **User Service**     | 5501 | 👤 User profiles & management       |
| **Business Service** | 5510 | 🏪 Business directory & locations   |
| **Category Service** | 5512 | 📂 Hierarchical category management |
| **PDF Service**      | 5514 | 📄 Document generation & processing |

### Infrastructure Services

| Service        | Port | Credentials              | Purpose                          |
| -------------- | ---- | ------------------------ | -------------------------------- |
| **PostgreSQL** | 5435 | `postgres:postgres@pika` | 🗃️ Primary database with PostGIS |
| **Redis**      | 6380 | No authentication (dev)  | 🔴 Caching & session storage     |

### Development URLs

- **🌐 API Gateway**: http://127.0.0.1:5500
- **📖 API Documentation**: http://127.0.0.1:5500/docs (Interactive Scalar UI)
- **🗃️ Database**: postgresql://postgres:postgres@127.0.0.1:5435/pika
- **🔴 Redis**: redis://127.0.0.1:6380

---

## 🔧 Technology Stack

<table>
<tr>
<td width="50%">

### 🚀 Core Stack

| Technology     | Version | Purpose                    |
| -------------- | ------- | -------------------------- |
| **Node.js**    | 22.x    | Runtime with ESM modules   |
| **TypeScript** | 5.8.3   | Type safety & DX           |
| **Express**    | 5.1.0   | HTTP framework             |
| **PostgreSQL** | 17.2    | Primary database + PostGIS |
| **Prisma**     | 6.9.0   | Type-safe ORM              |
| **Redis**      | 7.x     | Caching & sessions         |
| **NX**         | 21.1.3  | Monorepo orchestration     |

</td>
<td width="50%">

### 🛠️ Dev Tools

| Tool         | Version | Purpose           |
| ------------ | ------- | ----------------- |
| **Vitest**   | 3.2.2   | Testing framework |
| **ESLint**   | 9.28.0  | Code linting      |
| **Prettier** | 3.5.3   | Code formatting   |
| **esbuild**  | 0.25.5  | Fast bundling     |
| **tsx**      | 4.19.4  | TS execution      |
| **Husky**    | Latest  | Git hooks         |
| **OpenAPI**  | 3.1     | API specs         |

</td>
</tr>
</table>

### 🎯 Platform Features

- **🏗️ Clean Architecture**: Strict separation of concerns with Controller → Service → Repository pattern
- **🔒 Type Safety**: 100% TypeScript coverage with strict configuration and runtime validation
- **⚡ Performance**: Sub-millisecond caching, connection pooling, and optimized builds
- **🧪 Testing Strategy**: Integration-first testing with real services and databases
- **📊 Caching Strategy**: Multi-tier caching (Redis + method decorators + HTTP headers)
- **🛡️ Enterprise Security**: JWT authentication, API keys, CORS, rate limiting, input validation
- **📖 Self-Documenting**: OpenAPI specs generated from code with interactive documentation
- **🌐 Internationalization**: Multi-language support with translation key system
- **🚀 Deployment Ready**: Docker containers, health checks, metrics, and monitoring
- **🔄 Service Communication**: HTTP-based with automatic retries, circuit breakers, and service discovery

### 🌟 Enterprise Patterns

- **API Gateway**: Centralized routing with dual deployment modes (proxy/embedded)
- **Service Mesh**: HTTP-based inter-service communication with authentication
- **Event Sourcing**: Audit trails and state management
- **CQRS**: Command-query separation for optimal performance
- **Idempotency**: Duplicate request prevention for critical operations
- **Circuit Breakers**: Fault tolerance and graceful degradation
- **Distributed Tracing**: Correlation IDs and request tracking
- **Health Monitoring**: Comprehensive health checks and dependency validation

---

## 🏛️ Microservices Architecture

The platform features a comprehensive microservices ecosystem with specialized services for different business domains:

### 🏪 Business Service (`@pika/business-service`)

**Business Directory & Location Management**

- **Core Features**: Business registration, profile management, location-based services
- **Architecture**: Clean Architecture with i18n translation key system
- **Capabilities**: Geospatial search with PostGIS, business categorization, hours management
- **Performance**: Redis caching with intelligent cache invalidation
- **API Tiers**: Public, Admin, and Internal endpoints with role-based access

### 📂 Category Service (`@pika/category-service`)

**Hierarchical Category Management System**

- **Core Features**: Multi-level category trees with unlimited nesting
- **Architecture**: Materialized path pattern for fast hierarchy queries
- **Capabilities**: Path traversal, breadcrumb generation, bulk operations
- **Performance**: Aggressive caching strategies with dependency tracking
- **Data Integrity**: Circular reference prevention, sort order management

### 👤 User Service (`@pika/user-service`)

**User Management & Authentication**

- **Core Features**: User profiles, authentication, role-based access control
- **Architecture**: JWT-based authentication with refresh token rotation
- **Capabilities**: Multi-tier user roles, profile management, preferences
- **Security**: Password hashing, account verification, security audit trails
- **Integration**: Cross-service user context and session management

### 📄 PDF Service (`@pika/pdf-service`)

**Document Generation & Processing**

- **Core Features**: A5 voucher book generation, QR code integration
- **Architecture**: Dynamic page layout engine with content optimization
- **Capabilities**: Multi-language support, image processing, print-quality output
- **Performance**: Streaming PDF generation with memory optimization
- **Security**: Input validation, secure image fetching, JWT-secured QR codes

### 🌐 API Gateway (`@pika/api-gateway`)

**Service Orchestration & Routing**

- **Core Features**: Centralized request routing and service discovery
- **Architecture**: Dual deployment modes (proxy for microservices, embedded for serverless)
- **Capabilities**: Load balancing, rate limiting, request/response transformation
- **Security**: Authentication gateway, CORS handling, DDoS protection
- **Monitoring**: Request tracing, performance metrics, health aggregation

### 🔐 Authentication Framework (`@pika/auth`)

**Enterprise Authentication System**

- **Core Features**: JWT token management with RS256 signing
- **Architecture**: Stateless authentication with Redis token blacklisting
- **Capabilities**: Multi-strategy auth, refresh token rotation, session management
- **Security**: Secure token storage, automatic token refresh, role-based permissions
- **Integration**: Cross-service authentication with API key management

### 🌐 Translation Service (`@pika/translation`)

**Internationalization & Localization**

- **Core Features**: Multi-language content management system
- **Architecture**: Translation key-based system with intelligent caching
- **Capabilities**: Dynamic language detection, user preferences, content localization
- **Performance**: Aggressive caching with smart invalidation strategies
- **Scalability**: Support for multiple languages with easy content updates

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

### 🚀 Vercel Deployment

Pika supports deployment to Vercel using an embedded services architecture where all microservices run within a single serverless function. This is ideal for MVPs and smaller deployments.

**Production URL**: https://pika-backend.vercel.app

#### Prerequisites

- Vercel account with a project created
- Environment variables configured in Vercel dashboard
- Database (Supabase/PostgreSQL) accessible from Vercel
- Frontend workspace excluded from build (handled automatically)

#### Configuration

1. **Environment Variables** - Set these in Vercel Dashboard:

```bash
# Core Configuration
NODE_ENV=production
DEPLOYMENT_PLATFORM=vercel
CACHE_DISABLED=true                    # Required to avoid Redis connection limits

# Database (Supabase example)
DATABASE_URL=postgres://postgres.PROJECT_ID:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
MIGRATION_DATABASE_URL=postgres://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
PG_HOST=aws-0-sa-east-1.pooler.supabase.com
PG_PORT=6543
PG_USER=postgres.PROJECT_ID
PG_PASSWORD=your-password
PG_DATABASE=postgres
PG_SSL=true

# URLs
API_GATEWAY_BASE_URL=https://pika-backend.vercel.app
BASE_URL=https://pika-backend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Authentication (Generated)
JWT_SECRET=your-jwt-secret
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
INTERNAL_API_TOKEN=your-api-token
SERVICE_API_KEY=your-service-key

# Optional Services
REDIS_URL=redis://...                  # Only if CACHE_DISABLED=false
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
```

2. **Build Configuration** - Vercel automatically detects:
   - Build Command: `yarn build:vercel`
   - Output Directory: `api`
   - Install Command: `yarn install --immutable`

3. **Database Migrations** - Automatic on deployment:

**Automatic Migrations**: Database migrations run automatically during deployment to main branch. The `build:vercel` script includes `yarn db:migrate:deploy` which applies any pending migrations.

For manual migrations or first-time setup:

```bash
# Use Supabase SQL Editor if Prisma times out
# Go to Supabase Dashboard → SQL Editor → Run the migration SQL

# Or use Prisma directly
export DATABASE_URL="postgres://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
```

#### Deployment Process

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link to your project
vercel link

# 3. Deploy to production
vercel --prod

# Or push to GitHub for automatic deployment
git push origin main
```

#### Architecture Notes

- **Embedded Services**: All microservices run in a single Node.js process
- **API Gateway**: Handles routing to embedded services
- **Cold Starts**: First request may take 5-10 seconds
- **Redis**: Disabled by default to avoid connection limits (uses memory cache)
- **File Storage**: Configure cloud storage (S3/Cloudinary) for production

#### Troubleshooting Vercel Deployment

**Redis Connection Errors:**

- Set `CACHE_DISABLED=true` to use in-memory caching
- See `FIX_REDIS_MULTIPLE_CONNECTIONS.md` for details

**Build Failures:**

- Ensure all environment variables are set
- Check build logs for missing dependencies
- Verify `yarn install --immutable` succeeds locally

**Runtime Errors:**

- Check function logs in Vercel dashboard
- Verify database connectivity
- Ensure JWT keys are properly formatted with `\n`

**Performance:**

- Enable caching headers for static responses
- Consider edge functions for frequently accessed endpoints
- Monitor function execution time and memory usage

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

## 📚 Package Documentation

Each package includes comprehensive documentation:

- **🌐 [@pika/api-gateway](packages/api-gateway/README.md)** - Service orchestration & dual deployment modes
- **📋 [@pika/api](packages/api/README.md)** - OpenAPI 3.1 specifications & three-tier API design
- **🗃️ [@pika/database](packages/database/README.md)** - Multi-schema PostgreSQL with PostGIS extensions
- **⚙️ [@pika/environment](packages/environment/README.md)** - Type-safe configuration management
- **🤝 [@pika/shared](packages/shared/README.md)** - Cross-service utilities & error handling
- **🔐 [@pika/auth](packages/auth/README.md)** - JWT authentication framework
- **🛠️ [@pika/sdk](packages/sdk/README.md)** - Domain models, DTOs & mappers
- **🌐 [@pika/translation](packages/translation/README.md)** - Multi-language support system
- **⚡ [@pika/http](packages/http/README.md)** - Express.js framework foundation
- **🔴 [@pika/redis](packages/redis/README.md)** - High-performance caching layer
- **📝 [@pika/types](packages/types/README.md)** - Centralized type system
- **🚀 [@pika/deployment](packages/deployment/README.md)** - Platform deployment adapters
- **🏪 [@pika/business-service](packages/services/business/README.md)** - Business directory & management
- **📂 [@pika/category-service](packages/services/category/README.md)** - Hierarchical category system
- **📄 [@pika/pdf-service](packages/services/pdf/README.md)** - Document generation & processing

## 🎯 Platform Highlights

### 🏗️ Enterprise Architecture

- **Clean Architecture** with strict layer separation
- **Three-tier API design** (Public/Admin/Internal)
- **Multi-schema database** with domain separation
- **Service mesh** with HTTP-based communication

### ⚡ Performance & Scalability

- **Sub-millisecond caching** with Redis and method decorators
- **Connection pooling** for database and cache operations
- **Optimized builds** with esbuild and NX caching
- **Dual deployment modes** for microservices and serverless

### 🛡️ Security & Reliability

- **JWT authentication** with RS256 signing and token blacklisting
- **Input validation** with Zod schemas and runtime type checking
- **Service authentication** with API keys and correlation tracking
- **Error handling** with comprehensive error classification

### 🌐 Developer Experience

- **Self-documenting APIs** with OpenAPI 3.1 generation
- **Type safety** with 100% TypeScript coverage
- **Integration testing** with real databases and services
- **Hot reload** development with instant feedback

## 🖥️ Frontend Applications

The Pika platform includes modern frontend applications built with React and TypeScript:

- **📊 Dashboard**: Admin dashboard for platform management → **[pika-frontend-dashboard](https://github.com/Merodami/pika-frontend-dashboard)**

## 📚 Additional Resources

- **🏗️ Architecture Guide**: `CLAUDE.md` - Comprehensive development patterns and best practices
- **📊 Documentation Plan**: `ADVANCED_DOCUMENTATION_PLAN.md` - Standardized documentation strategy
- **📈 Documentation Status**: `DOCUMENTATION_STATUS.md` - Package documentation tracking
- **📋 API Specifications**: `packages/api/src/` - OpenAPI schemas and validation
- **📝 Type Definitions**: `packages/types/src/` - Shared TypeScript definitions

---

## 📝 License

This project is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)** with additional restrictions.

### ⚠️ IMPORTANT: Commercial Use Restriction

**Commercial use of this software is NOT permitted without explicit written permission from the copyright holder.**

### What this means:

- ✅ **Free for personal, educational, and non-commercial use**
- ✅ **Free to study, modify, and distribute for non-commercial purposes**
- ❌ **Commercial/business use requires a commercial license**
- ⚠️ **Network use requires source code disclosure** - If you run this software as a web service, you must make your source code available to users
- ⚠️ **Derivative works must use compatible license**
- ⚠️ **No sublicensing** - Cannot change license terms

### Commercial Licensing

If you wish to use this software for commercial purposes (including but not limited to):

- Running a business or for-profit service
- Internal use within a commercial organization
- Offering this software as a service to customers
- Any use that generates revenue

You MUST obtain a commercial license. Please contact the copyright holder at [open an issue](https://github.com/Merodami/pika-backend/issues) to discuss commercial licensing options.

**Full license text**: [LICENSE](./LICENSE)

---

## 🎯 Quick Commands Reference

<details>
<summary><b>📚 Click to expand command reference</b></summary>

### Development

```bash
yarn local              # Start all services
yarn kill               # Stop all services
yarn build              # Build all packages
yarn test               # Run all tests
yarn check              # Run all quality checks
```

### Database

```bash
yarn db:migrate         # Run migrations
yarn db:seed            # Seed with test data
yarn db:generate        # Generate Prisma client
```

### Code Quality

```bash
yarn typecheck          # TypeScript checks
yarn lint               # ESLint + Prettier
yarn lint:fix           # Auto-fix issues
yarn format             # Format all files
```

### API Development

```bash
yarn generate:api       # Generate OpenAPI specs
yarn generate:sdk       # Generate TypeScript SDK
yarn generate:docs      # Generate API docs
```

### Infrastructure

```bash
yarn docker:local       # Start PostgreSQL + Redis
yarn docker:restart     # Restart containers
```

</details>

---

<div align="center">

## 🚀 Get Started Now

```bash
git clone https://github.com/Merodami/pika-backend.git
cd pika-backend
yarn install && yarn docker:local && yarn local:generate && yarn local
```

<br />

**Built with ❤️ using Modern TypeScript, Clean Architecture, and Enterprise Patterns**

<br />

<p>
  <a href="#-quick-start">Quick Start</a> •
  <a href="https://github.com/Merodami/pika-backend/issues">Report Bug</a> •
  <a href="https://github.com/Merodami/pika-backend/issues">Request Feature</a> •
  <a href="#-license">Commercial License</a>
</p>

</div>
