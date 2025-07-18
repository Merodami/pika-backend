# Intra-Service Connectivity Implementation Plan

## Overview

This plan outlines the implementation of a comprehensive internal API contract system with schema validation, type generation, and documentation for service-to-service connectivity in the Solo60 platform. The platform already has a robust HTTP-based service client infrastructure, but needs a unified approach for internal API contracts similar to the public API SDK.

## Current State

### ✅ Existing Infrastructure

- **BaseServiceClient**: Abstract base class with retry logic, context propagation, and service authentication
- **HttpClient**: Axios-based implementation with automatic retries and error transformation
- **Service Authentication**: Uses `x-api-key` header with `SERVICE_API_KEY` for service-to-service auth
- **Existing Service Clients**:
  - `UserServiceClient` - User validation and role checking (enhanced with getUserByEmail)
  - `GymServiceClient` - Gym data and pricing
  - `PaymentServiceClient` - Credit operations and Stripe integration
  - `SubscriptionServiceClient` - Subscription management
  - `CommunicationServiceClient` - Emails and notifications (enhanced with internal API methods)

### ✅ Completed Components (Phase 1 Progress)

- **Internal API Schemas Created**:
  - `session/service.ts` - Complete session service internal endpoints
  - `auth/service.ts` - Complete auth service internal endpoints
  - `communication/service.ts` - Complete communication service internal endpoints
- **Service Clients Created**:
  - `SessionServiceClient` - Full implementation with internal API methods
  - `AuthServiceClient` - Full implementation with internal API methods
- **CommunicationServiceClient Enhanced**:
  - Added `sendSystemNotification` method
  - Added `sendTransactionalEmail` method
- **UserServiceClient Enhanced**:
  - Added `getUserByEmail` method for internal lookups
- **Validation Middleware Created**:
  - `internal-api-validation.ts` in @solo60/http package
- **Session Service Communication Integration**:
  - Implemented all email notifications in SessionService
  - Implemented guest invitation emails in SessionInviteeService
  - Implemented waiting list notifications in WaitingListService
  - Added content approval/rejection notifications

### ❌ Remaining Components

- Payment Service integrations for Session Service
- Simple async communication strategy (using existing retry logic)
- Complete internal API documentation generation
- Contract testing setup
- Communication Service integrations for Auth and Subscription services

## Architecture Overview

### Internal API Contract System

The internal API contract system will follow these industry-standard patterns:

1. **Contract-First Development**: Define schemas in `@solo60/api/internal` using Zod
2. **Code Generation**: Generate TypeScript types, validators, and clients from schemas
3. **Runtime Validation**: Validate requests/responses at service boundaries
4. **Documentation**: Auto-generate OpenAPI specs for internal APIs
5. **Type Safety**: End-to-end type safety between services

### Technology Stack

- **Schema Definition**: Zod (already in use for public APIs)
- **Code Generation**:
  - `zod-to-openapi` - Generate OpenAPI specs from Zod schemas
  - `openapi-typescript` - Generate TypeScript types from OpenAPI
  - `openapi-zod-client` - Generate typed HTTP clients with validation
- **Documentation**: Redoc/Swagger UI for internal API docs
- **Validation**: Zod runtime validation with Express middleware
- **Testing**: Contract testing with Pact or similar

## Implementation Plan

### Phase 0: Internal API Contract Foundation (Priority: CRITICAL)

#### 0.1 Extend @solo60/api Package Structure

**Current Structure**:

```
packages/api/src/
├── public/         # Public API schemas
├── internal/       # Internal API schemas (partial)
├── admin/          # Admin API schemas
└── common/         # Shared schemas
```

**Enhanced Structure**:

```
packages/api/src/
├── public/         # Public API schemas
├── internal/       # Internal API schemas (complete)
│   ├── schemas/
│   │   ├── auth/
│   │   ├── communication/
│   │   ├── gym/
│   │   ├── payment/
│   │   ├── session/     # NEW
│   │   ├── subscription/
│   │   └── user/
│   ├── contracts/   # NEW - Service contracts
│   │   ├── IAuthService.ts
│   │   ├── ICommunicationService.ts
│   │   ├── IGymService.ts
│   │   ├── IPaymentService.ts
│   │   ├── ISessionService.ts
│   │   ├── ISubscriptionService.ts
│   │   └── IUserService.ts
│   └── index.ts
├── admin/          # Admin API schemas
├── common/         # Shared schemas
└── codegen/        # NEW - Code generation config
    ├── internal-api.config.ts
    └── templates/
```

#### 0.2 Create Internal Service Contracts

**Location**: `packages/api/src/internal/contracts/`

**Example - ISessionService.ts**:

```typescript
import { z } from 'zod'
import { contract } from '@ts-rest/core'
import { schemas } from '../schemas/session/index.js'

export const SessionServiceContract = contract({
  // Session CRUD
  getSession: {
    method: 'GET',
    path: '/internal/sessions/:id',
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: schemas.SessionResponse,
      404: schemas.ErrorResponse,
    },
  },

  // Conflict checking
  checkConflicts: {
    method: 'POST',
    path: '/internal/sessions/conflicts',
    body: schemas.ConflictCheckRequest,
    responses: {
      200: schemas.ConflictCheckResponse,
    },
  },

  // Bulk operations
  getSessionsByUser: {
    method: 'GET',
    path: '/internal/sessions/by-user/:userId',
    pathParams: z.object({ userId: z.string() }),
    query: schemas.PaginationParams,
    responses: {
      200: schemas.SessionListResponse,
    },
  },
})
```

#### 0.3 Setup Code Generation Pipeline

**Package**: `packages/api/codegen/internal-api.config.ts`

```typescript
export default {
  // Input: Zod schemas
  input: './src/internal/contracts/*.ts',

  // Outputs
  outputs: [
    {
      // Generate OpenAPI specs
      type: 'openapi',
      path: './dist/internal-api.openapi.json',
      version: '3.0.0',
      info: {
        title: 'Solo60 Internal API',
        version: '1.0.0',
      },
    },
    {
      // Generate TypeScript clients
      type: 'typescript-client',
      path: '../shared/src/generated/internal-clients/',
      clientName: '${serviceName}Client',
      withRuntime: true,
    },
    {
      // Generate validators
      type: 'validators',
      path: '../shared/src/generated/validators/',
    },
  ],
}
```

#### 0.4 Create Validation Middleware

**Location**: `packages/http/src/middleware/internal-api-validation.ts`

```typescript
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'

export function validateInternalRequest(schema: { body?: z.ZodSchema; query?: z.ZodSchema; params?: z.ZodSchema }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate with detailed error messages
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body)
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query)
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params)
      }
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: error.errors,
          correlationId: req.headers['x-correlation-id'],
        })
      }
      next(error)
    }
  }
}
```

### Phase 1: Create Missing Service Clients (Priority: HIGH)

#### 1.1 Generate Service Clients from Contracts

With the contract system in place, service clients will be auto-generated:

**Generated Client Example**:

```typescript
// Auto-generated from contracts
export class SessionServiceClient extends BaseServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config)
  }

  async getSession(id: string, context?: ServiceContext) {
    return this.get<SessionResponse>(`/internal/sessions/${id}`, { context, useServiceAuth: true })
  }

  async checkConflicts(data: ConflictCheckRequest, context?: ServiceContext) {
    return this.post<ConflictCheckResponse>('/internal/sessions/conflicts', data, { ...context, useServiceAuth: true })
  }

  // ... other auto-generated methods
}
```

**Manual Implementation Steps**:

1. Define missing schemas in `@solo60/api/internal/schemas/session/`
2. Create service contract in `@solo60/api/internal/contracts/ISessionService.ts`
3. Run code generation: `yarn generate:internal-api`
4. Add SESSION_SERVICE_URL to environment variables

#### 1.2 Implement Service-Side Contract Validation

**Location**: Each service's internal routes

**Example**: `packages/services/session/src/routes/internal.ts`

```typescript
import { Router } from 'express'
import { validateInternalRequest } from '@solo60/http'
import { internalSchemas } from '@solo60/api'

export function createInternalRouter(controller: SessionController) {
  const router = Router()

  // Apply service auth middleware
  router.use(requireServiceAuth())

  // Validated routes
  router.get(
    '/internal/sessions/:id',
    validateInternalRequest({
      params: internalSchemas.session.GetSessionParams,
    }),
    controller.getSessionInternal,
  )

  router.post(
    '/internal/sessions/conflicts',
    validateInternalRequest({
      body: internalSchemas.session.ConflictCheckRequest,
    }),
    controller.checkConflictsInternal,
  )

  return router
}
```

### Phase 2: Contract-Based Type System (Priority: HIGH)

#### 2.1 Unified Type Generation Strategy

Instead of creating a separate contracts package, leverage the existing `@solo60/api` package as the single source of truth:

**Type Flow Architecture**:

```
@solo60/api (Zod Schemas)
    ↓
Code Generation Pipeline
    ↓
├── @solo60/api/dist/types/       # Generated TS types
├── @solo60/api/dist/validators/  # Runtime validators
├── @solo60/api/dist/openapi/     # OpenAPI specs
└── @solo60/shared/src/generated/ # Service clients

Benefits:
- Single source of truth for all API contracts
- No circular dependencies
- Auto-generated types stay in sync
- Runtime validation included
```

#### 2.2 Implement Type Generation Scripts

**Location**: `packages/api/scripts/generate-internal-types.ts`

```typescript
import { generateSchema } from '@anatine/zod-openapi'
import { Project } from 'ts-morph'
import * as internalSchemas from '../src/internal/index.js'

async function generateInternalTypes() {
  // 1. Generate OpenAPI from Zod schemas
  const openApiSpec = generateSchema(internalSchemas)

  // 2. Generate TypeScript types
  const project = new Project()
  const sourceFile = project.createSourceFile('../dist/types/internal.d.ts', { statements: [] }, { overwrite: true })

  // 3. Generate service clients
  for (const [service, contract] of Object.entries(contracts)) {
    await generateServiceClient(service, contract)
  }

  // 4. Generate validators
  await generateValidators(internalSchemas)
}
```

#### 2.3 Update Build Pipeline

**package.json scripts**:

```json
{
  "scripts": {
    "generate:internal-api": "tsx scripts/generate-internal-types.ts",
    "build": "yarn generate:internal-api && tsc && tsc-alias",
    "dev:generate": "tsx watch src/internal --exec 'yarn generate:internal-api'",
    "generate:all": "yarn generate:openapi && yarn generate:internal-api"
  }
}
```

The project uses:

- `tsx` for TypeScript execution and watch mode
- `tsc-alias` for path alias resolution
- `concurrently` for running multiple processes
- NX for monorepo orchestration

### Phase 3: Implement Service Integrations (Priority: MEDIUM)

#### 3.1 Session Service → Communication Service ✅ COMPLETED

**Tasks**:

- ✅ Send approval request emails to admin
- ✅ Send noise warning emails for Field Street Gym
- ✅ Send cancellation emails to guests
- ✅ Send invitation emails to guests
- ✅ Send spot availability notifications
- ✅ Send approval/rejection emails to users

**Implementation Location**: `packages/services/session/src/services/SessionService.ts`

**Implementation Details**:

- Added `CommunicationServiceClient` to SessionService, SessionInviteeService, and WaitingListService
- Created proper email templates using `sendTransactionalEmail` for guest invitations and cancellations
- Created system notifications using `sendSystemNotification` for approvals and waiting list
- All implementations follow fire-and-forget pattern with error logging

#### 3.2 Session Service → Payment Service

**Tasks**:

- Process refunds for cancelled sessions
- Process payments with payment info
- Credit back session prices

**Implementation Location**: `packages/services/session/src/services/SessionService.ts`

#### 3.3 Subscription Service → Communication Service ✅ COMPLETED

**Tasks Completed**:

- ✅ Added CommunicationServiceClient to SubscriptionService and CreditProcessingService constructors
- ✅ Send subscription creation confirmation emails (SUBSCRIPTION_ACTIVATED)
- ✅ Send subscription cancellation notifications (SUBSCRIPTION_EXPIRED)
- ✅ Send credit allocation notifications (PAYMENT_SUCCESS)
- ✅ Created internal API schemas for subscription service
- ✅ Implemented InternalSubscriptionController with webhook processing
- ✅ All email sending follows try-catch pattern without throwing errors

**Pending for Future**:

- ⏳ Send payment failure alerts (webhook endpoint created, implementation pending)
- ⏳ Send upcoming renewal reminders (7 days before)
- ⏳ Send trial expiration warnings (webhook endpoint created, implementation pending)

**Implementation Locations**:

- `packages/services/subscription/src/services/SubscriptionService.ts`
- `packages/services/subscription/src/services/CreditProcessingService.ts`

**Required Notifications**:

1. **Subscription Created**: Welcome email with plan details
2. **Subscription Cancelled**: Confirmation and end date
3. **Payment Failed**: Alert with retry information
4. **Credits Allocated**: Monthly credit notification
5. **Renewal Reminder**: 7 days before renewal
6. **Trial Ending**: 3 days before trial ends

#### 3.4 Auth Service → Communication Service

**Tasks**:

- Send email confirmation
- Send password reset initiation
- Send password reset confirmation
- Send account verification emails

**Implementation Location**: `packages/services/auth/src/services/AuthService.ts`

### Phase 4: Internal API Documentation System (Priority: HIGH)

#### 4.1 Generate Internal API Documentation

**Location**: `packages/api/src/scripts/generate-internal-docs.ts`

```typescript
import { generateOpenAPIDocument } from '@asteasolutions/zod-to-openapi'
import { writeFileSync } from 'fs-extra'
import * as internalSchemas from '../internal/index.js'

export async function generateInternalAPIDocs() {
  // Generate OpenAPI spec for internal APIs
  const openApiDoc = generateOpenAPIDocument(
    {
      openapi: '3.0.0',
      info: {
        title: 'Solo60 Internal Service APIs',
        version: '1.0.0',
        description: 'Service-to-service API contracts',
      },
      servers: [{ url: 'http://localhost:5500/internal', description: 'Local development' }],
      components: {
        securitySchemes: {
          ServiceAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'Service-to-service authentication key',
          },
        },
      },
      security: [{ ServiceAuth: [] }],
    },
    internalSchemas,
  )

  // Write OpenAPI spec
  await writeFileSync('generated/openapi/internal-api.json', JSON.stringify(openApiDoc, null, 2))

  // Generate HTML documentation using Scalar
  const htmlDoc = generateScalarDocs(openApiDoc)
  await writeFileSync('dist/internal-api-docs.html', htmlDoc)
}
```

#### 4.2 Service Contract Testing

**Location**: `packages/tests/src/contract-testing/`

```typescript
import { pactWith } from 'jest-pact'
import { SessionServiceClient } from '@solo60/shared'

pactWith(
  { consumer: 'UserService', provider: 'SessionService' },
  (interaction) => {
    it('retrieves user sessions', async () => {
      await interaction
        .given('user has active sessions')
        .uponReceiving('a request for user sessions')
        .withRequest({
          method: 'GET',
          path: '/internal/sessions/by-user/123',
          headers: { 'x-api-key': 'service-key' },
        })
        .willRespondWith({
          status: 200,
          body: { sessions: [...] },
        })

      const client = new SessionServiceClient({ serviceUrl: interaction.url })
      const result = await client.getSessionsByUser('123')
      expect(result.sessions).toHaveLength(2)
    })
  }
)
```

### Phase 5: Simplified Async Communication (Priority: LOW)

#### 5.1 Direct HTTP with Retry Strategy

Instead of a complex queue system, leverage the existing HttpClient retry capabilities for async operations:

**Enhanced Communication Service Client**:

```typescript
// packages/shared/src/services/clients/CommunicationServiceClient.ts
export class CommunicationServiceClient extends BaseServiceClient {
  constructor(config: ServiceClientConfig) {
    super({
      ...config,
      retries: config.retries || 3, // Default 3 retries
      timeout: config.timeout || 30000, // 30s timeout for emails
    })
  }

  async sendEmailAsync(data: SendTransactionalEmailRequest, context?: ServiceContext) {
    // Fire-and-forget with retry
    this.post('/internal/emails/send', data, context).catch((error) => {
      logger.error('Failed to send email after retries', { error, data })
      // Could write to a failed_emails table for manual retry later
    })
  }

  async sendEmailWithCallback(data: SendTransactionalEmailRequest, context?: ServiceContext): Promise<{ messageId: string }> {
    // Returns immediately with messageId, processes in background
    return this.post('/internal/emails/send-async', data, context)
  }
}
```

#### 5.2 Simple Background Processing

**Location**: `packages/services/communication/src/services/EmailService.ts`

```typescript
export class EmailService {
  private processingTasks = new Map<string, Promise<void>>()

  async sendAsync(request: SendTransactionalEmailRequest): Promise<{ messageId: string }> {
    const messageId = generateId()

    // Start processing in background
    const task = this.processEmail(messageId, request).catch((error) => {
      logger.error('Email processing failed', { messageId, error })
      // Store in database for retry
      return this.storeFailedEmail(messageId, request, error)
    })

    this.processingTasks.set(messageId, task)

    // Cleanup completed tasks periodically
    task.finally(() => {
      setTimeout(() => this.processingTasks.delete(messageId), 60000)
    })

    // Return immediately
    return { messageId }
  }

  private async processEmail(messageId: string, request: SendTransactionalEmailRequest) {
    // Actual email sending logic
    await this.emailProvider.send({
      to: request.userId,
      template: request.templateKey,
      data: request.variables,
    })
  }
}
```

#### 5.3 Database-Backed Retry for Critical Operations

For critical operations that must succeed:

```typescript
// Simple outbox pattern
export class OutboxService {
  constructor(private prisma: PrismaClient) {}

  async addMessage(type: string, payload: unknown): Promise<void> {
    await this.prisma.outboxMessage.create({
      data: {
        type,
        payload: JSON.stringify(payload),
        status: 'PENDING',
        attempts: 0,
      },
    })
  }

  async processOutbox(): Promise<void> {
    const messages = await this.prisma.outboxMessage.findMany({
      where: {
        status: 'PENDING',
        attempts: { lt: 3 },
        nextAttemptAt: { lte: new Date() },
      },
      take: 100,
    })

    for (const message of messages) {
      try {
        await this.processMessage(message)
        await this.prisma.outboxMessage.update({
          where: { id: message.id },
          data: { status: 'COMPLETED' },
        })
      } catch (error) {
        await this.prisma.outboxMessage.update({
          where: { id: message.id },
          data: {
            attempts: { increment: 1 },
            lastError: error.message,
            nextAttemptAt: new Date(Date.now() + Math.pow(2, message.attempts) * 1000),
          },
        })
      }
    }
  }
}
```

### Phase 6: Testing & Validation

#### 6.1 Integration Tests

- Test each new service client
- Test service-to-service authentication
- Test retry logic and error handling
- Test context propagation

#### 6.2 End-to-End Tests

- Test complete workflows (e.g., session booking → payment → notification)
- Test webhook flows
- Test error scenarios and compensation

## Implementation Order

### ✅ Completed (Dec 2024 - Jan 2025)

1. **Phase 0.1**: Created internal API schemas for Session, Auth, Communication, and User services
2. **Phase 0.4**: Created validation middleware for internal APIs
3. **Phase 1.1**: Created SessionServiceClient, AuthServiceClient, and enhanced UserServiceClient
4. **Phase 3.1**: Implemented Session Service → Communication Service integrations
5. **Phase 3.2**: Implemented Session Service → Payment Service integrations
6. **Phase 3.4**: Implemented Auth Service → User Service integrations
   - Created UserServiceClientAdapter for Auth Service
   - Implemented internal User API endpoints
   - Auth Service now uses User Service for all user data operations

### ✅ Completed (Dec 2024 - Jan 2025)

7. **Phase 3.3**: Implement Subscription Service → Communication Service integrations
   - Added CommunicationServiceClient to SubscriptionService and CreditProcessingService
   - Implemented subscription creation notifications (SUBSCRIPTION_ACTIVATED template)
   - Implemented subscription cancellation notifications (SUBSCRIPTION_EXPIRED template)
   - Implemented credit allocation notifications (PAYMENT_SUCCESS template)
   - Created internal API schemas and endpoints for subscription service
   - All notifications follow fire-and-forget pattern with proper error logging

### 🚧 Next Steps

8. **Phase 0.2-0.3**: Complete contract system and code generation pipeline
9. **Phase 2**: Implement contract-based type system
10. **Phase 4**: Setup internal API documentation
11. **Phase 5**: Implement simplified async communication
12. **Phase 6**: Testing and validation

## Technical Considerations

### Authentication

- All internal service endpoints must validate `x-api-key` header
- Use `useServiceAuth: true` flag in service client calls
- Exclude internal endpoints from JWT authentication middleware

### Error Handling

- Service clients should transform errors to appropriate HTTP status codes
- Include correlation IDs in all service-to-service calls
- Implement circuit breakers for resilience

### Monitoring

- Add OpenTelemetry tracing for service calls
- Log all service-to-service interactions
- Monitor service health endpoints

### Security

- Never expose internal service endpoints through API Gateway
- Rotate service API keys regularly
- Implement rate limiting on service endpoints

## Key Implementation Patterns

### 1. Contract-First Development

All internal APIs must be defined using Zod schemas first:

```typescript
// packages/api/src/internal/schemas/session/service.ts
export const GetSessionRequest = z.object({
  sessionId: UUID,
  includeRelations: z
    .object({
      user: z.boolean().optional(),
      gym: z.boolean().optional(),
      payments: z.boolean().optional(),
    })
    .optional(),
})

export const SessionResponse = z.object({
  id: UUID,
  userId: UserId,
  gymId: GymId,
  status: SessionStatus,
  // ... other fields
})
```

### 2. Auto-Generated Service Clients

Service clients are generated from contracts, ensuring type safety:

```typescript
// Usage in service code
const sessionClient = new SessionServiceClient({
  serviceUrl: SESSION_SERVICE_URL,
  serviceName: 'UserService',
})

// Type-safe calls with automatic validation
const session = await sessionClient.getSession({
  sessionId: '123',
  includeRelations: { user: true },
})
```

### 3. Runtime Validation Middleware

All internal endpoints use automatic request/response validation:

```typescript
// Automatically applied to all internal routes
router.use('/internal', validateInternalAPI())

// Service implementation
export async function getSessionInternal(req: ValidatedRequest<GetSessionRequest>) {
  // req.body is already validated and typed
  const { sessionId, includeRelations } = req.body

  const session = await sessionService.getSession(sessionId, includeRelations)

  // Response is validated against SessionResponse schema
  return session
}
```

### 4. Unified Documentation

All internal APIs are documented in a single place:

- Development: http://localhost:5500/internal/docs
- OpenAPI spec: `packages/api/dist/openapi/internal-api.json`
- Generated types: `packages/api/dist/types/internal/`

## Success Criteria

1. All internal API schemas defined in `@solo60/api/internal`
2. Service clients auto-generated with full type safety
3. Runtime validation on all service-to-service calls
4. No circular dependencies between packages
5. All pending integrations from ToDo.md implemented
6. Complete internal API documentation available
7. Contract tests passing for all service interactions
8. Simple async communication working with retry logic
9. Service mesh resilient to failures with proper error handling

## Risks & Mitigations

| Risk                         | Mitigation                                    |
| ---------------------------- | --------------------------------------------- |
| Service discovery complexity | Use static URLs from environment variables    |
| Cascading failures           | Implement circuit breakers and timeouts       |
| Data consistency             | Use idempotency keys and eventual consistency |
| Security vulnerabilities     | Regular security audits and API key rotation  |

## Future Enhancements

1. **Service Mesh**: Consider Istio or Linkerd for advanced traffic management
2. **Event Bus**: Implement event-driven architecture with Kafka/RabbitMQ
3. **Distributed Tracing**: Full OpenTelemetry implementation
4. **API Versioning**: Implement versioning strategy for service APIs
5. **Dynamic Service Discovery**: Move from static URLs to Consul/Eureka
