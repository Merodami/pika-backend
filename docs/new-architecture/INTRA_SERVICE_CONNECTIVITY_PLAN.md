# Intra-Service Connectivity Architecture

## Overview

This document describes the standardized HTTP-based communication patterns used for service-to-service connectivity in the Pika platform (formerly Solo60). The platform implements a robust service client infrastructure with authentication, retry logic, error handling, and distributed tracing.

## Current Architecture

### Core Infrastructure Components

#### 1. **BaseServiceClient**
Abstract base class providing common functionality for all service clients:

```typescript
// packages/shared/src/services/BaseServiceClient.ts
export abstract class BaseServiceClient {
  protected httpClient: HttpClient
  
  constructor(config: ServiceClientConfig) {
    this.httpClient = new HttpClient({
      baseURL: config.serviceUrl,
      serviceName: config.serviceName,
      retries: config.retries || 3,
      timeout: config.timeout || 10000,
    })
  }
  
  async healthCheck(): Promise<boolean>
  protected get<T>(path: string, options?: RequestOptions): Promise<T>
  protected post<T>(path: string, data: any, options?: RequestOptions): Promise<T>
  protected put<T>(path: string, data: any, options?: RequestOptions): Promise<T>
  protected delete<T>(path: string, options?: RequestOptions): Promise<T>
}
```

#### 2. **HttpClient**
Axios-based HTTP client with enterprise features:
- Automatic retry logic with exponential backoff
- Service authentication via headers
- Context propagation for distributed tracing
- Standardized error transformation
- Request/response interceptors

#### 3. **Service Authentication**
All internal service endpoints use API key authentication:

```typescript
// Service-to-service headers
{
  'x-api-key': process.env.SERVICE_API_KEY,
  'x-service-name': 'VoucherService',
  'x-service-id': 'voucher-service-instance-1',
  'x-correlation-id': 'abc-123',
  'x-user-id': 'user-123',
  'x-user-email': 'user@example.com'
}
```

### Service Client Pattern

Each service has a dedicated client class inheriting from BaseServiceClient:

```typescript
export class UserServiceClient extends BaseServiceClient {
  constructor(config?: Partial<ServiceClientConfig>) {
    super({
      serviceUrl: config?.serviceUrl || process.env.USER_API_URL || 'http://localhost:5022',
      serviceName: config?.serviceName || 'UserServiceClient',
      ...config,
    })
  }

  async getUser(userId: string, context?: ServiceContext): Promise<UserDomain> {
    return this.get<UserDomain>(`/internal/users/${userId}`, {
      context,
      useServiceAuth: true,
    })
  }

  async getUserByEmail(email: string, context?: ServiceContext): Promise<UserDomain | null> {
    const response = await this.get<{ user: UserDomain | null }>(
      `/internal/users/by-email`,
      {
        context,
        params: { email },
        useServiceAuth: true,
      }
    )
    return response.user
  }
}
```

## Existing Service Clients

### Infrastructure Services

1. **AuthServiceClient** (`/packages/shared/src/services/clients/AuthServiceClient.ts`)
   - Authentication and authorization operations
   - Token validation and user authentication

2. **UserServiceClient** (`/packages/shared/src/services/clients/UserServiceClient.ts`)
   - User data retrieval and management
   - Role checking and validation
   - Methods: `getUser()`, `getUserByEmail()`, `isAdmin()`, `createUser()`, `updateUser()`

3. **CommunicationServiceClient** (`/packages/shared/src/services/clients/CommunicationServiceClient.ts`)
   - Email and notification sending
   - Methods: `sendTransactionalEmail()`, `sendSystemNotification()`

4. **PaymentServiceClient** (`/packages/shared/src/services/clients/PaymentServiceClient.ts`)
   - Payment processing and credit operations
   - Stripe integration
   - Methods: `processSubscriptionCredits()`, `createProduct()`, `processInternalPayment()`

5. **StorageServiceClient** (`/packages/shared/src/services/clients/StorageServiceClient.ts`)
   - File storage and retrieval operations
   - Pre-signed URL generation

6. **SubscriptionServiceClient** (`/packages/shared/src/services/clients/SubscriptionServiceClient.ts`)
   - Subscription management
   - Credit allocation

### Missing Service Clients (To Be Created)

Based on service references in the codebase:
- **BusinessServiceClient** - Referenced in VoucherService but not yet implemented
- **CategoryServiceClient** - Referenced in CLAUDE.md but not yet implemented

## Service Communication Patterns

### 1. Internal API Routes

Each service exposes internal endpoints at `/internal/*` paths:

```typescript
// Example: Voucher Service Internal Routes
router.use(requireApiKey()) // Validates x-api-key header

router.post(
  '/internal/vouchers/by-ids',
  validateBody(GetVouchersByIdsRequest),
  controller.getVouchersByIds
)

router.get(
  '/internal/vouchers/user/:userId',
  validateParams(UserIdParam),
  validateQuery(SearchVouchersQuery),
  controller.getUserVouchers
)
```

### 2. Request Context Propagation

ServiceContext is passed through all service calls:

```typescript
interface ServiceContext {
  userId?: string
  userEmail?: string
  userRole?: string
  correlationId?: string
  serviceName?: string
  serviceId?: string
  useServiceAuth?: boolean
}
```

### 3. Error Handling Strategy

```typescript
try {
  const result = await this.userServiceClient.getUser(userId, context)
  return result
} catch (error) {
  if (error.code === 'USER_NOT_FOUND') {
    // Handle specific error
  }
  throw ErrorFactory.fromError(error)
}
```

### 4. Retry Logic

Built-in retry mechanism for transient failures:
- Default: 3 retries with exponential backoff
- Only retries on 5xx errors (server failures)
- No retry on 4xx errors (client errors)

### 5. Fire-and-Forget Pattern

For non-critical operations like notifications:

```typescript
// Don't await or throw on notification failures
this.communicationClient
  .sendTransactionalEmail({
    userId,
    templateKey: 'SESSION_CANCELLED',
    variables: { sessionName, date },
  })
  .catch(error => {
    logger.error('Failed to send cancellation email', { error, userId })
    // Continue processing - don't fail the main operation
  })
```

## Schema Organization for Internal APIs

### Structure
```
packages/api/src/internal/
├── schemas/
│   ├── auth/
│   │   └── service.ts
│   ├── business/
│   │   └── service.ts
│   ├── category/
│   │   └── service.ts
│   ├── communication/
│   │   └── service.ts
│   ├── payment/
│   │   └── service.ts
│   ├── subscription/
│   │   └── service.ts
│   ├── user/
│   │   └── service.ts
│   └── voucher/
│       └── service.ts
└── index.ts
```

### Schema Definition Pattern

```typescript
// packages/api/src/internal/schemas/voucher/service.ts
import { z } from 'zod'
import { openapi } from '../../../openapi.js'

export const GetVouchersByIdsRequest = openapi({
  body: z.object({
    voucherIds: z.array(z.string().uuid()),
  }),
})

export const GetVouchersByIdsResponse = openapi({
  vouchers: z.array(VoucherDTO),
})

export const GetUserVouchersParams = openapi({
  userId: z.string().uuid(),
})

export const GetUserVouchersQuery = openapi({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  state: z.enum(['active', 'redeemed', 'expired']).optional(),
})
```

## Service Authentication Middleware

```typescript
// packages/http/src/infrastructure/express/middleware/serviceAuth.ts
export function requireServiceAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key']
    const serviceName = req.headers['x-service-name']
    const serviceId = req.headers['x-service-id']

    if (!apiKey || apiKey !== process.env.SERVICE_API_KEY) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid service authentication',
      })
    }

    if (!serviceName || !serviceId) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Missing service identification headers',
      })
    }

    req.serviceAuth = { serviceName, serviceId }
    next()
  }
}
```

## Environment Configuration

Each service URL is configured via environment variables:

```env
# Service URLs
USER_API_URL=http://localhost:5022
AUTH_API_URL=http://localhost:5021
PAYMENT_API_URL=http://localhost:5023
COMMUNICATION_API_URL=http://localhost:5024
STORAGE_API_URL=http://localhost:5025
SUBSCRIPTION_API_URL=http://localhost:5026
VOUCHER_API_URL=http://localhost:5027
BUSINESS_API_URL=http://localhost:5028
CATEGORY_API_URL=http://localhost:5029

# Service Authentication
SERVICE_API_KEY=your-secure-api-key-here
```

## Implementation Guidelines

### 1. Creating a New Service Client

```typescript
// packages/shared/src/services/clients/BusinessServiceClient.ts
import { BaseServiceClient } from '../BaseServiceClient.js'
import type { ServiceClientConfig, ServiceContext } from '../types.js'
import type { BusinessDomain } from '@pika/sdk'

export class BusinessServiceClient extends BaseServiceClient {
  constructor(config?: Partial<ServiceClientConfig>) {
    super({
      serviceUrl: config?.serviceUrl || process.env.BUSINESS_API_URL || 'http://localhost:5028',
      serviceName: config?.serviceName || 'BusinessServiceClient',
      ...config,
    })
  }

  async getBusiness(businessId: string, context?: ServiceContext): Promise<BusinessDomain> {
    return this.get<BusinessDomain>(`/internal/businesses/${businessId}`, {
      context,
      useServiceAuth: true,
    })
  }

  async getBusinessesByIds(
    businessIds: string[],
    context?: ServiceContext
  ): Promise<BusinessDomain[]> {
    const response = await this.post<{ businesses: BusinessDomain[] }>(
      '/internal/businesses/by-ids',
      { businessIds },
      { context, useServiceAuth: true }
    )
    return response.businesses
  }
}
```

### 2. Implementing Internal Endpoints

```typescript
// packages/services/business/src/controllers/InternalBusinessController.ts
export class InternalBusinessController {
  constructor(private readonly businessService: IBusinessService) {
    this.getBusiness = this.getBusiness.bind(this)
    this.getBusinessesByIds = this.getBusinessesByIds.bind(this)
  }

  async getBusiness(
    request: Request<{ id: string }>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const business = await this.businessService.getById(request.params.id)
      response.json(business)
    } catch (error) {
      next(error)
    }
  }

  async getBusinessesByIds(
    request: Request<{}, {}, { businessIds: string[] }>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const businesses = await this.businessService.getByIds(request.body.businessIds)
      response.json({ businesses })
    } catch (error) {
      next(error)
    }
  }
}
```

### 3. Using Service Clients in Other Services

```typescript
// packages/services/voucher/src/services/VoucherService.ts
export class VoucherService {
  constructor(
    private readonly repository: IVoucherRepository,
    private readonly userServiceClient: UserServiceClient,
    private readonly businessServiceClient: BusinessServiceClient,
    private readonly communicationServiceClient: CommunicationServiceClient,
    private readonly cache: ICacheService
  ) {}

  async createVoucher(data: CreateVoucherData, context: ServiceContext): Promise<VoucherDomain> {
    // Validate business exists
    const business = await this.businessServiceClient.getBusiness(data.businessId, context)
    
    // Validate user if provided
    if (data.userId) {
      const user = await this.userServiceClient.getUser(data.userId, context)
    }
    
    // Create voucher
    const voucher = await this.repository.create(data)
    
    // Send notification (fire-and-forget)
    this.communicationServiceClient
      .sendTransactionalEmail({
        userId: data.userId,
        templateKey: 'VOUCHER_CREATED',
        variables: {
          voucherCode: voucher.code,
          businessName: business.name,
        },
      })
      .catch(error => {
        logger.error('Failed to send voucher creation email', { error })
      })
    
    return voucher
  }
}
```

## Best Practices

### 1. Service Isolation
- Each service should only communicate through well-defined internal APIs
- Never share database connections between services
- Use service clients for all cross-service data access

### 2. Error Handling
- Always use ErrorFactory for consistent error responses
- Include correlation IDs in all error logs
- Don't expose internal service errors to external clients

### 3. Performance
- Use caching where appropriate (Redis via ICacheService)
- Implement pagination for list endpoints
- Consider batch operations for bulk data fetches

### 4. Security
- Internal endpoints must validate `x-api-key` header
- Never expose internal endpoints through the API Gateway
- Rotate SERVICE_API_KEY regularly
- Use environment-specific API keys

### 5. Monitoring
- Log all service-to-service calls with correlation IDs
- Monitor service health endpoints
- Track retry attempts and failures
- Use distributed tracing for request flows

## Future Enhancements

### 1. Contract-First Development
Plan to implement auto-generation of service clients from OpenAPI schemas:
- Define all internal APIs using OpenAPI/Zod schemas
- Generate TypeScript clients automatically
- Ensure type safety across service boundaries

### 2. Service Mesh Considerations
For future scaling:
- Circuit breakers for cascading failure prevention
- Service discovery (currently using static URLs)
- Load balancing between service instances
- Advanced retry policies

### 3. Async Communication
For long-running or non-critical operations:
- Message queue integration (RabbitMQ/Kafka)
- Event-driven architecture patterns
- Eventual consistency handling

### 4. Enhanced Observability
- OpenTelemetry integration for distributed tracing
- Metrics collection for service performance
- Centralized logging with correlation
- Service dependency mapping

## Migration Notes

This architecture represents the current state after migrating from Solo60 to Pika:
- All "Solo60" references have been renamed to "Pika"
- Service structure follows Clean Architecture principles
- Consolidation of related services (e.g., voucher + redemptions)
- Standardized internal API patterns across all services

The system is designed for simplicity and reliability while maintaining the flexibility to evolve as the platform grows.