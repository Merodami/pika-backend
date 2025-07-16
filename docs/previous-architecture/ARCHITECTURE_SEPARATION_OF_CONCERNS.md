# Architecture Separation of Concerns Guide

## Overview

This guide defines the critical architectural boundaries in our microservices platform. Violating these boundaries breaks the clean architecture principles and creates maintenance nightmares.

## Core Principles

1. **Dependencies flow inward** - Outer layers depend on inner layers, never the reverse
2. **No circular dependencies** - A cannot depend on B if B depends on A
3. **Cross-service communication only through defined interfaces** - Service clients, not direct imports
4. **Each layer has a specific responsibility** - Don't mix concerns

## System-Wide Architecture

```mermaid
graph TB
    subgraph "External Layer"
        CLIENT[Frontend Apps]
        WEBHOOK[External Webhooks]
        THIRD[3rd Party APIs]
    end

    subgraph "API Gateway Layer"
        GATEWAY[API Gateway]
        AUTH_MW[Auth Middleware]
    end

    subgraph "API Contract Layer"
        API_SCHEMAS[@pika/api - OpenAPI Schemas]
        SDK[@pikas & Mappers]
    end

    subgraph "Service Layer"
        subgraph "User Service"
            USER_CTRL[User Controller]
            USER_SVC[User Service]
            USER_REPO[User Repository]
        end

        subgraph "Session Service"
            SESSION_CTRL[Session Controller]
            SESSION_SVC[Session Service]
            SESSION_REPO[Session Repository]
        end

        subgraph "Payment Service"
            PAY_CTRL[Payment Controller]
            PAY_SVC[Payment Service]
            PAY_REPO[Payment Repository]
        end
    end

    subgraph "Shared Infrastructure"
        HTTP[@pika
        AUTH[@pika
        REDIS[@pika
        SHARED[@pikaService Clients]
    end

    subgraph "Database Layer"
        DB_PKG[@pika
        PRISMA[Prisma Client]
        DB[(PostgreSQL)]
    end

    %% Allowed flows
    CLIENT --> GATEWAY
    GATEWAY --> USER_CTRL
    GATEWAY --> SESSION_CTRL
    GATEWAY --> PAY_CTRL

    USER_CTRL --> API_SCHEMAS
    USER_CTRL --> SDK
    USER_CTRL --> USER_SVC

    SESSION_CTRL --> API_SCHEMAS
    SESSION_CTRL --> SDK
    SESSION_CTRL --> SESSION_SVC

    USER_SVC --> USER_REPO
    SESSION_SVC --> SESSION_REPO
    PAY_SVC --> PAY_REPO

    USER_REPO --> PRISMA
    SESSION_REPO --> PRISMA
    PAY_REPO --> PRISMA

    PRISMA --> DB

    %% Inter-service communication (allowed)
    SESSION_SVC --> SHARED
    SHARED --> USER_CTRL

    %% Forbidden flows (shown with red X)
    API_SCHEMAS -.->|❌ FORBIDDEN| PRISMA
    SDK -.->|❌ FORBIDDEN| PRISMA
    DB_PKG -.->|❌ FORBIDDEN| API_SCHEMAS
    USER_SVC -.->|❌ FORBIDDEN| SESSION_SVC
    SESSION_CTRL -.->|❌ FORBIDDEN| USER_REPO

    style API_SCHEMAS fill:#e3f2fd
    style SDK fill:#e3f2fd
    style SHARED fill:#fff3e0
    style PRISMA fill:#ffebee
    style DB fill:#ffebee
```

## Layer-by-Layer Rules

### 1. API Contract Layer (`@pika

**Purpose**: Define the public API contract

**CAN import from:**

- `@pikaShared enums and types
- `zod` - Schema validation

**CANNOT import from:**

- ❌ `@prisma/client` - No database dependencies
- ❌ Any service packages - Must remain service-agnostic
- ❌ `@pika - No database layer access
- ❌ Express or HTTP frameworks - Pure type definitions only

**Example Violation:**

```typescript
// ❌ WRONG - API schemas importing from database
import { User } from '@prisma/client'
export const UserSchema = z.object({...})

// ✅ CORRECT - Define schemas independently
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email()
})
```

### 2. SDK Layer (`@pika

**Purpose**: Data transformation between API and domain

**CAN import from:**

- `@pikaShared enums
- `@pikant` - Global constants

**CANNOT import from:**

- ❌ `@prisma/client` - No ORM dependencies
- ❌ Any service packages - Must be service-independent
- ❌ `@pikaK doesn't depend on API schemas
- ❌ Express/HTTP types - No framework dependencies

### 3. Database Layer (`@pika)

**Purpose**: Database schema and migrations

**CAN import from:**

- Nothing - It's the innermost layer

**CANNOT import from:**

- ❌ `@pikatabase doesn't know about API
- ❌ `@pikatabase doesn't know about DTOs
- ❌ Any service packages - Database is independent
- ❌ Any HTTP/framework packages

**Example Violation:**

```typescript
// ❌ WRONG - Database importing API types
import { UserStatus } from '@pika

// ✅ CORRECT - Define enums in database schema
enum UserStatus {
  ACTIVE
  INACTIVE
}
```

### 4. Service Layer

**Purpose**: Business logic implementation

**Controllers CAN import from:**

- `@pikar request/response types
- `@pikar mappers and DTOs
- `@pikaor middleware
- Own service's Service classes

**Controllers CANNOT import from:**

- ❌ Other service's internals - No cross-service controller imports
- ❌ Repository classes directly - Go through Service layer
- ❌ `@prisma/client` - Use repository pattern

**Services CAN import from:**

- `@pika For service clients ONLY
- Own service's Repository classes
- `@pikaFor shared types

**Services CANNOT import from:**

- ❌ Other service's Services directly - Use service clients
- ❌ Controller classes - Wrong direction
- ❌ `@pikarvices don't know about HTTP

**Repositories CAN import from:**

- `@prisma/client` - For database access
- `@pika - For Prisma client

**Repositories CANNOT import from:**

- ❌ Service classes - Wrong direction
- ❌ Controller classes - Wrong direction
- ❌ `@pikapositories don't know about API

### 5. Inter-Service Communication

**Allowed Pattern - Through Service Clients:**

```typescript
// ✅ CORRECT - Using service client from @pika
import { UserServiceClient } from '@pika

export class SessionService {
  constructor(private userClient: UserServiceClient) {}

  async createSession(userId: string) {
    const user = await this.userClient.getUser(userId)
    // ... business logic
  }
}
```

**Forbidden Pattern - Direct Service Import:**

```typescript
// ❌ WRONG - Directly importing from another service
import { UserService } from '@pika

export class SessionService {
  constructor(private userService: UserService) {}
  // This creates tight coupling!
}
```

## Common Architecture Violations

### Violation 1: API Schemas Importing Prisma Types

```typescript
// ❌ WRONG - in @pika
import { SessionStatus } from '@prisma/client'

// ✅ CORRECT
import { SessionStatus } from '@pika
```

### Violation 2: Cross-Service Direct Imports

```typescript
// ❌ WRONG - in session service
import { UserRepository } from '@pikasitories'

// ✅ CORRECT
import { UserServiceClient } from '@pika
```

### Violation 3: Controllers Accessing Repositories Directly

```typescript
// ❌ WRONG - in controller
import { UserRepository } from '../repositories/UserRepository'
const user = await userRepository.findById(id)

// ✅ CORRECT
const user = await this.userService.getUser(id)
```

### Violation 4: Database Package Importing API Types

```typescript
// ❌ WRONG - in database schema
import { PaginationParams } from '@pika

// ✅ CORRECT - Define independently or use @pika
```

### Violation 5: Service Layer Importing API Schemas

```typescript
// ❌ WRONG - in service
import { CreateUserRequest } from '@pika

// ✅ CORRECT - Use domain types
import { UserDomain } from '@pika
```

## Package Dependency Rules

```mermaid
graph LR
    subgraph "Allowed Dependencies"
        TYPES[@pika
        ENV[@pikant]

        TYPES --> ENV
        API --> TYPES
        SDK --> TYPES
        SDK --> ENV

        SERVICE --> SDK
        SERVICE --> SHARED
        SERVICE --> DB

        CTRL[Controller] --> API
        CTRL --> SDK
        CTRL --> SERVICE

        REPO[Repository] --> DB
        SERVICE --> REPO
    end

    subgraph "Forbidden Dependencies"
        API_X[@pika|❌| DB_X[@p@p@p@p@p@pika
        SDK_X[@pika|❌| API_X
        DB_X -.->|❌| API_X
        SERVICE_A -.->|❌| SERVICE_B
        REPO_X[Repository] -.->|❌| SERVICE_X[Service]
    end
```

## Validation Checklist

Before any PR, verify:

### Layer Isolation

- [ ] No imports from `@prisma/client` in API or SDK packages
- [ ] No imports from `@pikaatabase package
- [ ] No imports from `@pikaervice layers
- [ ] No direct cross-service imports (use service clients)

### Dependency Direction

- [ ] Controllers don't import repositories
- [ ] Repositories don't import services
- [ ] Services don't import controllers
- [ ] Database doesn't import from any other package

### Inter-Service Communication

- [ ] All cross-service calls go through service clients
- [ ] Service clients are imported from `@pika
- [ ] No direct service-to-service imports

### Type Safety

- [ ] Shared types are in `@pika
- [ ] API contracts are in `@pika
- [ ] Domain types are in `@pika
- [ ] No type duplication across packages

## Build-Time Enforcement

Add these checks to your build process:

```bash
# Check for forbidden imports
grep -r "@prisma/client" packages/api packages/sdk
grep -r "@pikaages/database packages/services/*/src/services

# Ensure service isolation
grep -r "from '@pikakages/services/session
grep -r "from '@pikapackages/services/user
```

## Conclusion

Clean architecture isn't just about organizing code—it's about creating maintainable, testable, and scalable systems. Each violation of these rules:

- Creates hidden dependencies
- Makes testing harder
- Reduces code reusability
- Increases coupling
- Makes refactoring dangerous

**Remember**: If you're unsure whether an import is allowed, it probably isn't. When in doubt, ask: "Does this create a dependency in the wrong direction?"

## Quick Reference

| Package            | Can Import                                | Cannot Import                                       |
| ------------------ | ----------------------------------------- | --------------------------------------------------- |
| `@pika | `@p@p@p@p@p@pika              | `@prisma/client`, services, `@pik@pik@pik@pik@pik@pika
| `@pika | `@p@p@p@p@p@pikaik@pik@pik@pikaient`, `@pika/@pikae@pika @pika @pika@pika
| `@pika | Nothing                                   | Everything                                          |
| Controllers        | `@pika@p@p@p@p@pika Other services, repositories, `@prisma/client`      |
| Services           | `@pikaown repository          | Other services directly, `@p@p@p@p@p@pika
| Repositories       | `@prisma/client`, `@pika      | Services, controllers, `@p@p@p@p@p@pika |
