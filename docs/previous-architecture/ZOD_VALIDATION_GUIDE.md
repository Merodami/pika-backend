# Zod Validation Guide

This guide consolidates all Zod validation documentation for the Pika platform.

## Overview

The platform uses Zod for request validation across all services. Zod provides:

- Type-safe validation with TypeScript inference
- Excellent error messages
- Intuitive API
- Strong ecosystem support

## Quick Start

### Service Routes

```typescript
import { validateBody, validateQuery, validateParams } from '@pika/http'
import { CreateUserRequest, UserSearchParams } from '@pikac'

// Body validation
router.post('/users', requireAuth(), validateBody(CreateUserRequest), controller.createUser)

// Query validation
router.get('/users', requireAuth(), validateQuery(UserSearchParams), controller.getUsers)

// Params validation
router.get('/users/:id', requireAuth(), validateParams(z.object({ id: z.string().uuid() })), controller.getUserById)
```

## Schema Organization

### Package Structure

```
@pika
├── public/     # Public API schemas (frontend/mobile)
├── admin/      # Admin API schemas
└── internal/   # Internal service-to-service schemas
```

### Import Pattern

```typescript
// Public API schemas
import { LoginRequest, UserProfile } from '@pikac'

// Admin API schemas
import { CreateCreditPackRequest } from '@pika'

// Internal API schemas
import { InternalCreditOperationRequest } from '@pikanal'
```

## Common Schemas

### Branded Types

```typescript
import { UserId, Email, Money, Credits } from '@pikac'

// Strong typing with validation
const userId = UserId.parse('123e4567-e89b-12d3-a456-426614174000')
const email = Email.parse('USER@EXAMPLE.COM') // Normalized to lowercase
const amount = Money.parse(1000) // Amount in cents
```

### Pagination

```typescript
import { PaginatedRequest, PaginatedResponse } from '@pikac'

// Request with pagination
const SearchRequest = PaginatedRequest.extend({
  name: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// Response with pagination
const SearchResponse = PaginatedResponse(UserSchema)
```

### Error Responses

```typescript
import { ErrorResponse, ValidationErrorResponse } from '@pikac'

// Consistent error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["email"],
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Service Implementation

### Controller Pattern

```typescript
export class UserController {
  async createUser(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      // Request body is already validated and typed
      const user = await this.userService.create(request.body)
      response.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }
}
```

### Route Setup

```typescript
export function createUserRouter(prisma: PrismaClient, cache: ICacheService): Router {
  const router = Router()
  const repository = new UserRepository(prisma, cache)
  const service = new UserService(repository, cache)
  const controller = new UserController(service)

  router.post('/', requireAuth(), validateBody(CreateUserRequest), controller.createUser)

  return router
}
```

## API Gateway Integration

### Validation Middleware

```typescript
import { validateBody, validateQuery } from '@pika
import { LoginRequest } from '@pikac'

// Gateway validates before forwarding
router.post('/api/v1/auth/login', validateBody(LoginRequest), proxyToService('auth-service'))
```

### Headers

Services receive a header when gateway has validated:

```typescript
if (req.headers['x-gateway-validated'] === 'true') {
  // Skip validation in service
}
```

## Error Handling

Validation errors return HTTP 400 with consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error: Invalid input",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email",
      "code": "invalid_string"
    }
  ],
  "correlationId": "req_123456",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Best Practices

1. **Always use schemas from @pikaon't define validation schemas in services
2. **Import from the correct API scope** - Use `/public`, `/admin`, or `/internal`
3. **Use branded types** - Prefer `UserId` over `string` for type safety
4. **Let middleware handle validation** - Don't call `parse()` manually in controllers
5. **Use proper error handling** - Validation errors are handled by error middleware

## Testing

```typescript
describe('POST /users', () => {
  it('should validate request body', async () => {
    const response = await request(app).post('/users').send({ email: 'invalid-email' }).expect(400)

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      details: expect.arrayContaining([
        expect.objectContaining({
          path: ['email'],
          message: expect.stringContaining('email'),
        }),
      ]),
    })
  })
})
```

## Available Validation Functions

| Function         | Purpose               | Example                           |
| ---------------- | --------------------- | --------------------------------- |
| `validateBody`   | Validate request body | `validateBody(CreateUserRequest)` |
| `validateQuery`  | Validate query params | `validateQuery(SearchParams)`     |
| `validateParams` | Validate route params | `validateParams(IdParam)`         |

## Schema Helpers

```typescript
// Make schema partial (all fields optional)
const UpdateRequest = CreateRequest.partial()

// Pick specific fields
const EmailOnly = UserSchema.pick({ email: true })

// Omit fields
const UserWithoutPassword = UserSchema.omit({ password: true })

// Extend schemas
const ExtendedUser = UserSchema.extend({
  role: z.enum(['USER', 'ADMIN']),
})
```
