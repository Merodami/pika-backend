# 🏢 Pika - Enterprise Microservices Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![NX](https://img.shields.io/badge/NX-21.1.3-lightblue?logo=nx)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.2-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7.x-red?logo=redis)
![Express](https://img.shields.io/badge/Express-5.1.0-black?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-6.9.0-indigo?logo=prisma)

_A comprehensive business platform built with modern microservices architecture, Clean Architecture principles, and enterprise-grade patterns._

**🚀 Modern Stack** • **⚡ High Performance** • **🛡️ Production Ready** • **🧪 Testing First** • **📖 Self-Documenting**

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

## 🏗️ Architecture Overview

Pika is built on **Clean Architecture** principles with a **microservices** design orchestrated through **NX monorepo**. The platform features enterprise-grade patterns including three-tier API design, comprehensive caching strategies, and production-ready deployment patterns.

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

### 🚀 Core Technologies

- **Runtime**: Node.js 22.x with ESM modules and modern JavaScript features
- **Language**: TypeScript 5.8.3 with strict configuration and advanced types
- **Framework**: Express 5.1.0 with comprehensive middleware stack
- **Database**: PostgreSQL 17.2 with PostGIS extensions and Prisma 6.9.0 ORM
- **Caching**: Redis 7.x with ioredis client and advanced caching patterns
- **Monorepo**: NX 21.1.3 with Yarn 4.9.1 Berry workspaces

### 🛠️ Development Tools

- **Build System**: esbuild 0.25.5 with tsc-alias path resolution for blazing-fast builds
- **Testing**: Vitest 3.2.2 with Testcontainers 11.0.1 for real database testing
- **Code Quality**: ESLint 9.28.0, Prettier 3.5.3, Husky git hooks for consistency
- **Hot Reload**: tsx 4.19.4 for instant TypeScript execution and development
- **Process Management**: concurrently, fkill-cli for multi-service orchestration
- **API Generation**: OpenAPI 3.1 spec generation with Scalar documentation

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

## 📚 Additional Resources

- **🏗️ Architecture Guide**: `CLAUDE.md` - Comprehensive development patterns and best practices
- **📊 Documentation Plan**: `ADVANCED_DOCUMENTATION_PLAN.md` - Standardized documentation strategy
- **📈 Documentation Status**: `DOCUMENTATION_STATUS.md` - Package documentation tracking
- **📋 API Specifications**: `packages/api/src/` - OpenAPI schemas and validation
- **📝 Type Definitions**: `packages/types/src/` - Shared TypeScript definitions

---

## 📝 License

Pika Enterprise Platform - Internal development project.

---

<div align="center">

**🚀 Quick Start Command**

```bash
yarn install && yarn docker:local && yarn local:generate && yarn local
```

**Built with ❤️ using Modern TypeScript, Clean Architecture, and Enterprise Patterns**

</div>
