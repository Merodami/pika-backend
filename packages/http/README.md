# HTTP Package

Express.js framework utilities and middleware for the Pika platform, providing standardized HTTP server creation, authentication, validation, and cross-cutting concerns.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/http:build

# Run tests
yarn nx run @pika
```

## 📋 Overview

The HTTP package provides a comprehensive Express.js foundation for all Pika microservices:

- **Server Factory**: Standardized Express server creation with opinionated defaults
- **Authentication Middleware**: JWT validation and service-to-service auth
- **Request Validation**: Zod schema validation with OpenAPI integration
- **Error Handling**: Centralized error processing and response formatting
- **Security**: Helmet, CORS, rate limiting, and security headers
- **Observability**: Request logging, health checks, and metrics
- **File Upload**: Multer integration with validation and limits

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── application/           # Application layer
│   └── api/               # API utilities
│       ├── healthCheck.ts # Health check endpoints
│       └── server.ts      # Express server factory
├── domain/                # Domain layer
│   └── types/             # Domain types
│       ├── healthCheck.ts # Health check types
│       ├── idempotency.ts # Idempotency types
│       └── server.ts      # Server configuration types
├── infrastructure/        # Infrastructure layer
│   └── express/           # Express-specific implementations
│       ├── adapters/      # External service adapters
│       ├── context/       # Request context management
│       ├── middleware/    # Express middleware
│       └── validation/    # Request validation
├── types/                 # TypeScript extensions
│   └── express.ts         # Express type augmentations
├── utils/                 # Utilities
└── index.ts               # Package exports
```

### Key Components

- **Server Factory**: `createExpressServer()` - One-stop server creation
- **Authentication**: JWT and service-to-service authentication
- **Validation**: Zod schema validation with error formatting
- **Error Handler**: Standardized error responses
- **Health Checks**: Built-in health monitoring
- **Request Context**: Correlation IDs and user context

## 🔌 Usage

### Basic Server Creation

```typescript
import { createExpressServer } from '@pika
import { RedisService } from '@pika

const app = await createExpressServer({
  serviceName: 'user-service',
  port: 5501,
  cacheService: new RedisService(),
  routes: [
    { path: '/users', handler: userRoutes },
    { path: '/health', handler: healthRoutes },
  ],
})

// Server is now running with all middleware configured
```

### Advanced Server Configuration

```typescript
const app = await createExpressServer({
  serviceName: 'payment-service',
  port: 5505,

  // Authentication settings
  authOptions: {
    jwtSecret: process.env.JWT_SECRET,
    excludePaths: ['/webhooks/*', '/health'],
    serviceAuth: {
      enabled: true,
      apiKeyHeader: 'x-api-key',
    },
  },

  // CORS configuration
  corsOptions: {
    origin: ['https://app.pika.com', 'https://admin.pika.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },

  // Rate limiting
  rateLimitOptions: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
  },

  // File upload configuration
  uploadOptions: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },

  // Idempotency for payment operations
  idempotencyOptions: {
    enabled: true,
    defaultTTL: 86400, // 24 hours
    methods: ['POST', 'PUT', 'PATCH'],
    excludeRoutes: ['/health', '/metrics'],
  },
})
```

## 🛡️ Middleware Stack

### Built-in Middleware (Applied in Order)

1. **Security Headers** (Helmet)
2. **CORS** (Cross-Origin Resource Sharing)
3. **Compression** (gzip)
4. **Request Logging** (Morgan)
5. **Rate Limiting** (Express Rate Limit)
6. **Request Context** (Correlation IDs)
7. **Body Parsing** (JSON/URL-encoded)
8. **Authentication** (JWT validation)
9. **Service Authentication** (API key validation)
10. **Request Validation** (Zod schemas)
11. **Idempotency** (Duplicate request prevention)
12. **Error Handling** (Global error processor)

### Authentication Middleware

```typescript
// JWT Authentication
import { authMiddleware } from '@pika

router.get('/profile', authMiddleware, async (req, res) => {
  // req.user is automatically populated
  const user = req.user
  res.json({ user })
})

// Service-to-Service Authentication
router.post('/internal/process', serviceAuthMiddleware, async (req, res) => {
  // Validates x-api-key header
  const result = await internalService.process(req.body)
  res.json(result)
})
```

### Request Validation

```typescript
import { validateRequest } from '@pika
import { createUserSchema } from '@pika

router.post(
  '/users',
  validateRequest({
    body: createUserSchema,
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ include: z.string().optional() }),
  }),
  async (req, res) => {
    // Request is fully validated and typed
    const userData = req.body // Fully typed
    const userId = req.params.id // UUID validated
    const include = req.query.include // Optional string
  },
)
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=5001
SERVICE_NAME=user-service

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
SERVICE_API_KEY=internal-service-key

# Security
CORS_ORIGINS=https://app.pikaom,https://admin.pipika
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_REQUEST=5
ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Health Check Configuration

```typescript
import { HealthCheckConfig } from '@pika

const healthConfig: HealthCheckConfig = {
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
        await cacheService.ping()
        return { status: 'healthy' }
      },
    },
    {
      name: 'external-api',
      check: async () => {
        const response = await fetch('https://api.example.com/health')
        return {
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: response.headers.get('x-response-time'),
        }
      },
    },
  ],
  interval: 30000, // Check every 30 seconds
  timeout: 5000, // 5 second timeout per check
}
```

## 📊 Request Context

### Automatic Context Injection

```typescript
// Each request gets automatic context
interface RequestContext {
  correlationId: string // Unique request ID
  userId?: string // From JWT token
  serviceId?: string // From service auth
  userAgent?: string // Client information
  ip: string // Client IP
  timestamp: Date // Request timestamp
}

// Access context in handlers
router.get('/users', async (req, res) => {
  const context = req.context

  logger.info('Fetching users', {
    correlationId: context.correlationId,
    userId: context.userId,
  })

  // Context is automatically logged and tracked
})
```

### Correlation ID Tracking

```typescript
// Automatically generated and propagated
// Request: GET /users
// Response Headers: X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000

// Use for distributed tracing
const response = await fetch('/api/sessions', {
  headers: {
    'X-Correlation-ID': req.context.correlationId,
  },
})
```

## 🧪 Testing

```bash
# Run all tests
yarn nx run @pika

# Run integration tests
yarn nx run @pika --grep "integration"

# Test middleware
yarn nx run @pika --grep "middleware"
```

### Test Examples

```typescript
import { createExpressServer } from '@pika
import { MemoryCacheService } from '@pika
import supertest from 'supertest'

describe('HTTP Server', () => {
  let app: Express

  beforeEach(async () => {
    app = await createExpressServer({
      serviceName: 'test-service',
      cacheService: new MemoryCacheService(),
      routes: [{ path: '/test', handler: testRouter }],
    })
  })

  it('should apply authentication middleware', async () => {
    const response = await supertest(app).get('/protected').expect(401)

    expect(response.body.error).toBe('Authentication required')
  })

  it('should validate request bodies', async () => {
    const response = await supertest(app).post('/users').send({ invalidData: true }).expect(400)

    expect(response.body.errors).toBeDefined()
  })
})
```

## 🚨 Error Handling

### Standardized Error Responses

```typescript
// All errors follow this format
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "correlationId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Custom Error Classes

```typescript
import { ApplicationError, ValidationError } from '@pika

// Automatic error handling
router.post('/users', async (req, res, next) => {
  try {
    if (!req.body.email) {
      throw new ValidationError('Email is required')
    }

    const user = await userService.create(req.body)
    res.json(user)
  } catch (error) {
    next(error) // Automatically handled and formatted
  }
})
```

## 📈 Performance Features

### Built-in Optimizations

- **Response Compression**: Automatic gzip compression
- **Keep-Alive**: HTTP connection reuse
- **Request Deduplication**: Idempotency middleware
- **Caching Headers**: Automatic cache control
- **Static Asset Serving**: Optimized static file delivery

### Monitoring Integration

```typescript
// Automatic metrics collection
router.get('/users', async (req, res) => {
  // Automatically tracked:
  // - Response time
  // - Status code
  // - Error rate
  // - Request count

  const users = await userService.getAll()
  res.json(users)
})

// Access metrics at /metrics endpoint
// Prometheus-compatible format
```

## 🔄 Integration Patterns

### Service Communication

```typescript
// Inter-service communication helper
import { createServiceClient } from '@pika

const userServiceClient = createServiceClient({
  baseURL: process.env.USER_SERVICE_URL,
  apiKey: process.env.SERVICE_API_KEY,
  timeout: 5000,
  retries: 3,
})

// Automatic service authentication
const user = await userServiceClient.get(`/users/${userId}`)
```

### Webhook Handling

```typescript
// Special webhook configuration
const app = await createExpressServer({
  serviceName: 'payment-service',

  // Skip JSON parsing for webhooks
  skipJsonParsing: ['/webhooks/stripe'],

  // Custom middleware for webhooks
  customMiddleware: [
    {
      path: '/webhooks/stripe',
      middleware: express.raw({ type: 'application/json' }),
    },
  ],
})
```

## 🔄 Future Enhancements

- [ ] WebSocket support
- [ ] gRPC gateway
- [ ] OpenTelemetry integration
- [ ] Circuit breaker pattern
- [ ] Advanced rate limiting
- [ ] Request/response caching
- [ ] API versioning utilities
