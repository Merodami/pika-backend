# Error Handling Guide

This guide provides a comprehensive approach to error handling in the Pika microservices architecture, combining strategy and implementation details for consistent error management across all services.

## Overview

Our error handling system addresses key challenges in distributed systems:

- Error accumulation across service boundaries
- Consistent error response formats
- Debugging complexity with proper traceability
- Performance impacts from large error payloads
- Security concerns with error information exposure

## Core Principles

1. **Standardize** - Consistent error formats across all services
2. **Correlate** - Use request IDs for error tracing
3. **Categorize** - Group errors for predictable handling
4. **Isolate** - Prevent error context accumulation at boundaries
5. **Secure** - Log detailed errors internally, return sanitized versions externally

## Error Types and Categories

### Standard Error Types

| Error Type              | HTTP Status | Category         | Usage                                     |
| ----------------------- | ----------- | ---------------- | ----------------------------------------- |
| `ValidationError`       | 400         | VALIDATION       | Input validation failures                 |
| `AuthenticationError`   | 401         | AUTHENTICATION   | Missing or invalid credentials            |
| `AuthorizationError`    | 403         | AUTHORIZATION    | Insufficient permissions                  |
| `ResourceNotFoundError` | 404         | NOT_FOUND        | Resource doesn't exist                    |
| `ConflictError`         | 409         | CONFLICT         | State conflicts (e.g., duplicate entries) |
| `BusinessRuleError`     | 422         | BUSINESS_RULE    | Business logic violations                 |
| `RateLimitError`        | 429         | RATE_LIMIT       | Too many requests                         |
| `InternalError`         | 500         | INTERNAL         | Server errors                             |
| `ExternalServiceError`  | 502         | EXTERNAL_SERVICE | Downstream service failures               |

### Error Categories

```typescript
export enum ErrorCategory {
  VALIDATION = 'VALIDATION', // 400
  AUTHENTICATION = 'AUTHENTICATION', // 401
  AUTHORIZATION = 'AUTHORIZATION', // 403
  NOT_FOUND = 'NOT_FOUND', // 404
  CONFLICT = 'CONFLICT', // 409
  BUSINESS_RULE = 'BUSINESS_RULE', // 422
  RATE_LIMIT = 'RATE_LIMIT', // 429
  INTERNAL = 'INTERNAL', // 500
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // 502
}
```

## Implementation

### 1. Enhanced Error Factory

```typescript
export class ErrorFactory {
  // Standard error creators
  static validationError(errors: Record<string, string[]>, context?: ErrorContext): ValidationError {
    return new ValidationError('Validation failed', {
      ...context,
      code: 'VALIDATION_ERROR',
      category: ErrorCategory.VALIDATION,
      validationErrors: errors,
    })
  }

  static resourceNotFound(resource: string, id: string, context?: ErrorContext): ResourceNotFoundError {
    return new ResourceNotFoundError(`${resource} with id ${id} not found`, {
      ...context,
      code: 'RESOURCE_NOT_FOUND',
      category: ErrorCategory.NOT_FOUND,
      metadata: { resource, id },
    })
  }

  static uniqueConstraintViolation(entity: string, field: string, value: string, context?: ErrorContext): ConflictError {
    return new ConflictError(`${entity} with ${field} '${value}' already exists`, {
      ...context,
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      category: ErrorCategory.CONFLICT,
      metadata: { entity, field, value },
    })
  }

  static businessRuleViolation(rule: string, message: string, context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(message, {
      ...context,
      code: 'BUSINESS_RULE_VIOLATION',
      category: ErrorCategory.BUSINESS_RULE,
      metadata: { rule },
    })
  }

  /**
   * Creates a boundary error for service-to-service communication
   * Only essential information crosses the boundary
   */
  static createBoundaryError(originalError: any, serviceName: string, requestId: string): ServiceBoundaryError {
    // Log full error internally
    logger.error(`${serviceName} service error:`, {
      originalError,
      stack: originalError.stack,
      context: originalError.context,
      requestId,
    })

    // Return sanitized boundary error
    return new ServiceBoundaryError(originalError.message || 'Service error occurred', {
      code: originalError.context?.code || 'SERVICE_ERROR',
      requestId,
      originalService: serviceName,
      category: originalError.context?.category || ErrorCategory.INTERNAL,
      timestamp: new Date(),
    })
  }
}
```

### 2. Error Context Interface

```typescript
export interface ErrorContext {
  // Core fields
  code: string
  category: ErrorCategory
  requestId?: string
  timestamp?: Date

  // Service information
  source?: string // e.g., "CategoryService.createCategory"
  serviceName?: string
  serviceOperation?: string

  // Optional fields
  suggestion?: string // How to fix the issue
  metadata?: Record<string, any> // Additional context (limited size)

  // Validation specific
  validationErrors?: Record<string, string[]>
}
```

### 3. Standard Error Response Format

```typescript
export interface StandardErrorResponse {
  error: {
    code: string
    message: string
    category: string
    requestId: string
    timestamp: string // ISO string
    details?: {
      validationErrors?: Record<string, string[]>
      suggestion?: string
      metadata?: Record<string, any> // Only in development
    }
  }
}
```

### 4. Error Boundary Middleware

```typescript
export function errorBoundaryMiddleware(err: any, req: FastifyRequest, reply: FastifyReply): void {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId()

  // Log full error internally
  logger.error('Request error:', {
    error: err,
    stack: err.stack,
    context: err.context,
    requestId,
    path: req.url,
    method: req.method,
  })

  // Determine HTTP status
  const status = mapCategoryToHttpStatus(err.context?.category || ErrorCategory.INTERNAL)

  // Build standard response
  const errorResponse: StandardErrorResponse = {
    error: {
      code: err.context?.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      category: err.context?.category || ErrorCategory.INTERNAL,
      requestId,
      timestamp: new Date().toISOString(),
      details: buildErrorDetails(err, process.env.NODE_ENV),
    },
  }

  reply.status(status).send(errorResponse)
}

function buildErrorDetails(err: any, environment: string): any {
  const details: any = {}

  if (err.context?.validationErrors) {
    details.validationErrors = err.context.validationErrors
  }

  if (err.context?.suggestion) {
    details.suggestion = err.context.suggestion
  }

  // Include metadata only in development
  if (environment === 'development' && err.context?.metadata) {
    details.metadata = err.context.metadata
  }

  return Object.keys(details).length > 0 ? details : undefined
}

function mapCategoryToHttpStatus(category: ErrorCategory): number {
  const statusMap: Record<ErrorCategory, number> = {
    [ErrorCategory.VALIDATION]: 400,
    [ErrorCategory.AUTHENTICATION]: 401,
    [ErrorCategory.AUTHORIZATION]: 403,
    [ErrorCategory.NOT_FOUND]: 404,
    [ErrorCategory.CONFLICT]: 409,
    [ErrorCategory.BUSINESS_RULE]: 422,
    [ErrorCategory.RATE_LIMIT]: 429,
    [ErrorCategory.INTERNAL]: 500,
    [ErrorCategory.EXTERNAL_SERVICE]: 502,
  }

  return statusMap[category] || 500
}
```

### 5. Request ID Middleware

```typescript
export function requestIdMiddleware(req: FastifyRequest, reply: FastifyReply, done: () => void): void {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId()

  // Ensure request ID is available throughout request lifecycle
  req.headers['x-request-id'] = requestId
  reply.header('x-request-id', requestId)

  // Add to request context for logging
  req.requestContext = { requestId }

  done()
}
```

## Service-to-Service Error Handling

### Making Service Calls

```typescript
export class ServiceClient {
  async getUser(userId: string, requestId: string): Promise<User> {
    try {
      const response = await this.httpClient.get(`/users/${userId}`, {
        headers: { 'x-request-id': requestId },
      })

      return response.data
    } catch (error) {
      // Handle boundary errors from downstream service
      if (this.isBoundaryError(error)) {
        throw ErrorFactory.createError(error.response.data.error.code, {
          requestId,
          category: error.response.data.error.category,
          metadata: {
            service: 'user-service',
            downstreamMessage: error.response.data.error.message,
            downstreamRequestId: error.response.data.error.requestId,
          },
        })
      }

      // Network or unexpected errors
      throw ErrorFactory.externalServiceError('user-service', 'Failed to fetch user', {
        requestId,
        metadata: {
          operation: 'getUser',
          userId,
          errorMessage: error.message,
        },
      })
    }
  }

  private isBoundaryError(error: any): boolean {
    return error.response?.data?.error?.category !== undefined
  }
}
```

### Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum'

export class ResilientServiceClient {
  private circuitBreaker: CircuitBreaker

  constructor(private httpClient: HttpClient) {
    this.circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      fallback: this.fallbackResponse.bind(this),
    })

    // Monitor circuit breaker events
    this.circuitBreaker.on('open', () => {
      logger.warn('Circuit breaker opened for service')
    })
  }

  async getUser(userId: string, requestId: string): Promise<User> {
    try {
      return await this.circuitBreaker.fire(userId, requestId)
    } catch (error) {
      throw ErrorFactory.externalServiceError('user-service', 'Service temporarily unavailable', {
        requestId,
        metadata: { circuitBreakerOpen: this.circuitBreaker.opened },
      })
    }
  }

  private async makeRequest(userId: string, requestId: string): Promise<User> {
    // Actual HTTP request implementation
  }

  private fallbackResponse(userId: string, requestId: string): User {
    // Return cached or default response
    throw ErrorFactory.externalServiceError('user-service', 'Service circuit breaker open', { requestId })
  }
}
```

## Repository Error Handling

### Prisma Error Handling Pattern

```typescript
export class PrismaRepository {
  async create(dto: CreateDto): Promise<Entity> {
    try {
      const entity = await this.prisma.entity.create({
        data: dto,
      })

      return this.mapper.toDomain(entity)
    } catch (error) {
      throw this.handlePrismaError(error, 'create', dto)
    }
  }

  private handlePrismaError(error: any, operation: string, data?: any): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          return this.handleUniqueConstraintError(error, data)

        case 'P2003': // Foreign key constraint violation
          return ErrorFactory.validationError({ reference: ['Referenced entity does not exist'] }, { source: `${this.constructor.name}.${operation}` })

        case 'P2025': // Record not found
          return ErrorFactory.resourceNotFound('Entity', data?.id || 'unknown', { source: `${this.constructor.name}.${operation}` })

        default:
          return ErrorFactory.databaseError(operation, 'Database operation failed', error, {
            source: `${this.constructor.name}.${operation}`,
            metadata: { errorCode: error.code },
          })
      }
    }

    // Fallback for unknown errors
    return ErrorFactory.internalError('Unexpected database error', {
      source: `${this.constructor.name}.${operation}`,
      metadata: { originalError: error.message },
    })
  }

  private handleUniqueConstraintError(error: Prisma.PrismaClientKnownRequestError, data: any): Error {
    const metaTarget = error.meta?.target as string[] | undefined
    const field = metaTarget?.[0] || 'field'
    const value = data?.[field] || 'unknown'

    return ErrorFactory.uniqueConstraintViolation('Entity', field, String(value), { source: `${this.constructor.name}.create` })
  }
}
```

## Testing Error Scenarios

### Unit Tests

```typescript
describe('ErrorFactory', () => {
  it('should create validation error with proper context', () => {
    const error = ErrorFactory.validationError({ email: ['Invalid email format'] }, { source: 'UserService.createUser', requestId: '123' })

    expect(error.context.code).toBe('VALIDATION_ERROR')
    expect(error.context.category).toBe(ErrorCategory.VALIDATION)
    expect(error.context.validationErrors).toEqual({
      email: ['Invalid email format'],
    })
  })

  it('should create boundary error with sanitized context', () => {
    const originalError = new Error('Database connection failed')
    originalError.context = {
      code: 'DB_CONNECTION_ERROR',
      dbHost: 'localhost:5432', // Sensitive info
      password: 'secret123', // Should not be included
    }

    const boundaryError = ErrorFactory.createBoundaryError(originalError, 'user-service', 'req-123')

    expect(boundaryError.context.originalService).toBe('user-service')
    expect(boundaryError.context.requestId).toBe('req-123')
    expect(boundaryError.context.dbHost).toBeUndefined()
    expect(boundaryError.context.password).toBeUndefined()
  })
})
```

### Integration Tests

```typescript
describe('API Error Responses', () => {
  it('should return standard validation error response', async () => {
    const response = await request(app).post('/users').send({ email: 'invalid-email' }).expect(400)

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        category: 'VALIDATION',
        message: expect.any(String),
        requestId: expect.any(String),
        timestamp: expect.any(String),
        details: {
          validationErrors: {
            email: expect.arrayContaining(['Invalid email format']),
          },
        },
      },
    })
  })

  it('should handle service communication errors', async () => {
    // Mock downstream service failure
    nock('http://user-service')
      .get('/users/123')
      .reply(502, {
        error: {
          code: 'DATABASE_UNAVAILABLE',
          category: 'EXTERNAL_SERVICE',
          message: 'Database connection failed',
        },
      })

    const response = await request(app).get('/profiles/123').expect(502)

    expect(response.body.error.category).toBe('EXTERNAL_SERVICE')
    expect(response.body.error.code).toBe('SERVICE_COMMUNICATION_ERROR')
  })
})
```

## Idempotency and Error Prevention

### System-Wide Idempotency Middleware

The platform includes a system-wide idempotency middleware that prevents duplicate processing of requests:

```typescript
// Client sends idempotency key
POST /redemptions/redeem
X-Idempotency-Key: unique-request-id-12345

// Middleware checks cache and returns cached response for duplicates
// Prevents errors from double-processing
```

Benefits:

- Prevents duplicate voucher redemptions
- Handles network retry scenarios gracefully
- Reduces database conflicts
- Improves overall system reliability

## Best Practices

### 1. Error Creation

```typescript
// ✅ Good: Specific error with context
throw ErrorFactory.resourceNotFound('User', userId, {
  source: 'UserService.getById',
  requestId: req.headers['x-request-id'],
})

// ❌ Bad: Generic error without context
throw new Error('User not found')
```

### 2. Error Context

```typescript
// ✅ Good: Limited, relevant context
throw ErrorFactory.businessRuleViolation('insufficient-balance', 'Account balance is insufficient for this transaction', {
  source: 'PaymentService.processPayment',
  suggestion: 'Please add funds to your account',
  metadata: {
    required: amount,
    available: balance,
  },
})

// ❌ Bad: Excessive context that accumulates
throw new Error('Payment failed', {
  previousError: accountError,
  accountDetails: fullAccount, // Too much data
  transactionHistory: transactions, // Unnecessary
})
```

### 3. Service Boundaries

```typescript
// ✅ Good: Transform at service boundary
try {
  const user = await userServiceClient.getUser(userId)
  return user
} catch (error) {
  // Transform external error to boundary error
  throw ErrorFactory.createBoundaryError(error, 'voucher-service', requestId)
}

// ❌ Bad: Pass through raw errors
try {
  const user = await userServiceClient.getUser(userId)
  return user
} catch (error) {
  throw error // Raw error crosses boundary
}
```

### 4. Logging

```typescript
// ✅ Good: Log full error, return sanitized
logger.error('Payment processing failed', {
  error: error.message,
  stack: error.stack,
  context: error.context,
  userId: req.user.id,
  requestId: req.requestContext.requestId,
})

// Return sanitized error to client
throw ErrorFactory.businessRuleViolation('payment-failed', 'Payment could not be processed')

// ❌ Bad: Expose internal details
throw new Error(`Payment failed: ${error.stack}`)
```

## Implementation Checklist

- [ ] Implement ErrorFactory with all standard error types
- [ ] Add request ID middleware to all services
- [ ] Configure error boundary middleware
- [ ] Update service clients to handle boundary errors
- [ ] Add circuit breakers for critical service dependencies
- [ ] Implement standard error response format
- [ ] Update repository error handling for Prisma
- [ ] Add comprehensive error scenario tests
- [ ] Configure error monitoring and alerting
- [ ] Document service-specific error codes

## Monitoring and Alerting

### Key Metrics

```typescript
// Prometheus metrics
export const errorMetrics = {
  // Total errors by category
  errorsTotal: new Counter({
    name: 'app_errors_total',
    help: 'Total number of errors',
    labelNames: ['category', 'code', 'service'],
  }),

  // Error rate by endpoint
  errorRate: new Histogram({
    name: 'app_error_rate',
    help: 'Error rate per endpoint',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
  }),

  // Circuit breaker state
  circuitBreakerState: new Gauge({
    name: 'app_circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open)',
    labelNames: ['service'],
  }),
}
```

### Alert Rules

```yaml
groups:
  - name: error_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(app_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High error rate detected'

      - alert: CircuitBreakerOpen
        expr: app_circuit_breaker_state == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Circuit breaker open for {{ $labels.service }}'
```

## Conclusion

This error handling guide provides a robust, scalable approach to managing errors in distributed microservices. By following these patterns, we ensure consistent error handling, improved debugging capabilities, and better user experience across all services.

Key takeaways:

- Use ErrorFactory for consistent error creation
- Implement error boundaries at service interfaces
- Correlate errors with request IDs
- Log detailed errors internally, return sanitized externally
- Test error scenarios comprehensively
- Monitor error patterns and set up appropriate alerts

Regular review and updates of error handling patterns ensure the system remains maintainable and debuggable as it grows.
