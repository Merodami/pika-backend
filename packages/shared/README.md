# Shared Package

Shared utilities, error handling, and common functionality for the Pika platform, providing consistent behavior across all microservices.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/shared:build

# Test utilities
yarn nx run @pikast
```

## 📋 Overview

The Shared package provides common utilities and patterns used across all Pika services:

- **Error Handling**: Standardized error classes and error factory
- **Health Checks**: Service health monitoring utilities
- **Service Clients**: HTTP client abstractions for inter-service communication
- **Logging**: Structured logging utilities
- **Storage**: File storage abstractions
- **Validation**: Common validation utilities
- **API Utilities**: Request handling and response formatting

## 🏗️ Architecture

```
src/
├── api/                   # API utilities
│   ├── index.ts           # API exports
│   ├── requestContextStore.ts # Request context
│   └── validateSource.ts  # Source validation
├── errors/               # Error handling
│   ├── ApplicationErrors.ts # Application-specific errors
│   ├── DomainErrors.ts    # Domain-specific errors
│   ├── ErrorBase.ts       # Base error class
│   ├── InfrastructureErrors.ts # Infrastructure errors
│   └── index.ts           # Error exports
├── infrastructure/       # Infrastructure utilities
│   ├── health/            # Health check system
│   │   ├── HealthCheck.ts     # Health check runner
│   │   ├── healthCheckRunner.ts # Check execution
│   │   ├── systemCheck.ts     # System health checks
│   │   └── types.ts           # Health check types
│   ├── logger/            # Logging utilities
│   │   ├── Logger.ts          # Structured logger
│   │   └── index.ts           # Logger exports
│   └── storage/           # Storage abstractions
│       ├── FileStorage.ts     # File storage interface
│       └── index.ts           # Storage exports
├── services/             # Service utilities
│   ├── BaseServiceClient.ts # Base HTTP client
│   ├── HttpClient.ts      # HTTP client wrapper
│   ├── clients/           # Service-specific clients
│   │   ├── CommunicationServiceClient.ts
│   │   ├── GymServiceClient.ts
│   │   ├── PaymentServiceClient.ts
│   │   ├── SubscriptionServiceClient.ts
│   │   ├── UserServiceClient.ts
│   │   └── index.ts           # Client exports
│   └── index.ts           # Service exports
├── types/                # Shared types
│   └── index.ts           # Type exports
├── utils/                # Utility functions
│   ├── apiSorting.ts      # API sorting utilities
│   ├── isUuidV4.ts        # UUID validation
│   ├── sorting.ts         # Sorting utilities
│   ├── validateRequiredFields.ts # Field validation
│   └── index.ts           # Utility exports
└── index.ts               # Main package exports
```

## 🔧 Usage

### Error Handling

```typescript
import { ErrorFactory, ApplicationError, ValidationError } from '@pika

// Create standardized errors
throw ErrorFactory.validationError('Invalid email format', {
  field: 'email',
  value: 'invalid-email',
})

// Domain-specific errors
throw ErrorFactory.notFoundError('User not found', {
  userId: 'user-123',
})

// Infrastructure errors
throw ErrorFactory.databaseError('Connection failed', originalError)
```

### Service Clients

```typescript
import { UserServiceClient, PaymentServiceClient } from '@pika

// Initialize service clients
const userClient = new UserServiceClient({
  baseURL: process.env.USER_SERVICE_URL,
  apiKey: process.env.SERVICE_API_KEY,
  timeout: 5000,
})

// Make service calls
const user = await userClient.getUserById('user-123')
const payment = await paymentClient.processPayment({
  amount: 50.0,
  userId: 'user-123',
})
```

### Health Checks

```typescript
import { HealthCheck, systemCheck } from '@pika

// Define service health checks
const healthCheck = new HealthCheck({
  checks: [
    {
      name: 'database',
      check: async () => {
        await prisma.$queryRaw`SELECT 1`
        return { status: 'healthy' }
      },
    },
    {
      name: 'redis',
      check: async () => {
        await redis.ping()
        return { status: 'healthy' }
      },
    },
    systemCheck, // Built-in system checks
  ],
})

// Run health checks
const health = await healthCheck.execute()
```

### Logging

```typescript
import { logger } from '@pika

// Structured logging
logger.info('User login successful', {
  userId: 'user-123',
  correlationId: 'req-456',
  timestamp: new Date().toISOString(),
})

logger.error('Payment processing failed', {
  error: error.message,
  stack: error.stack,
  userId: 'user-123',
  amount: 50.0,
})
```

### Validation Utilities

```typescript
import { validateRequiredFields, isUuidV4 } from '@pika

// Validate required fields
validateRequiredFields(requestBody, ['name', 'email', 'password'])

// UUID validation
if (!isUuidV4(userId)) {
  throw ErrorFactory.validationError('Invalid user ID format')
}
```

## 🧪 Testing

```bash
# Run all tests
yarn nx run @pikast

# Test error handling
yarn test --grep "error"

# Test service clients
yarn test --grep "client"

# Test health checks
yarn test --grep "health"
```

## 🔄 Service Communication

### Base Service Client

```typescript
import { BaseServiceClient } from '@pika

export class CustomServiceClient extends BaseServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config)
  }

  async getResource(id: string) {
    return this.get(`/resources/${id}`)
  }

  async createResource(data: CreateResourceData) {
    return this.post('/resources', data)
  }
}
```

### Service Client Features

- **Automatic Retry**: Configurable retry logic with exponential backoff
- **Request/Response Logging**: Structured logging for debugging
- **Error Transformation**: Converts HTTP errors to domain errors
- **Authentication**: Automatic API key injection
- **Timeout Handling**: Configurable request timeouts
- **Circuit Breaker**: Failure detection and recovery

## 🚨 Error Classification

### Application Errors

```typescript
// Business logic errors
ValidationError // Invalid input data
NotFoundError // Resource not found
UnauthorizedError // Authentication failed
ForbiddenError // Authorization failed
ConflictError // Resource conflict
```

### Domain Errors

```typescript
// Domain-specific errors
UserNotFoundError // User-specific not found
SessionFullError // Session capacity exceeded
InsufficientCreditsError // Not enough credits
GymClosedError // Gym not available
```

### Infrastructure Errors

```typescript
// System-level errors
DatabaseError // Database connection/query issues
CacheError // Redis/cache failures
ExternalServiceError // Third-party service failures
FileStorageError // File upload/download issues
```

## 📏 API Utilities

### Request Context

```typescript
import { requestContextStore } from '@pika

// Get current request context
const context = requestContextStore.getStore()
const { correlationId, userId, userAgent } = context

// Set context in middleware
requestContextStore.run(requestContext, () => {
  // All code in this scope has access to context
})
```

### API Sorting

```typescript
import { apiSorting } from '@pika

// Parse sort parameters
const sortOptions = apiSorting.parseSortString('name:asc,createdAt:desc')
// Result: [{ field: 'name', direction: 'asc' }, { field: 'createdAt', direction: 'desc' }]

// Apply to Prisma query
const users = await prisma.user.findMany({
  orderBy: apiSorting.toPrismaOrderBy(sortOptions),
})
```

## 📏 Storage Abstractions

```typescript
import { FileStorage } from '@pika

// Abstract file storage interface
interface IFileStorage {
  upload(file: Buffer, key: string): Promise<string>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  getSignedUrl(key: string, expiresIn: number): Promise<string>
}

// Use in services
class DocumentService {
  constructor(private storage: IFileStorage) {}

  async uploadDocument(file: Buffer, userId: string) {
    const key = `documents/${userId}/${Date.now()}`
    const url = await this.storage.upload(file, key)
    return { key, url }
  }
}
```

## 🔄 Future Enhancements

- [ ] Distributed tracing utilities
- [ ] Advanced caching abstractions
- [ ] Event bus implementation
- [ ] Configuration management
- [ ] Performance monitoring
- [ ] Circuit breaker patterns
- [ ] Retry strategy templates
- [ ] Rate limiting utilities
