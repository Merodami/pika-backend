# API

This package contains Zod schemas and OpenAPI specifications for the Pika platform.

## Structure

```
src/
├── public/      # Public API schemas for frontend/mobile
├── admin/       # Admin API schemas
├── internal/    # Internal service-to-service schemas
├── common/      # Shared schemas and utilities
└── scripts/     # OpenAPI generation scripts
```

## Usage

Import schemas based on API scope:

```typescript
// Public API
import { UserProfile, LoginRequest } from '@pika/api/public'

// Admin API
import { CreateCreditPackRequest } from '@pikapi/admin'

// Internal API
import { InternalCreditOperationRequest } from '@pikapi/internal'
```

## Validation

All services use Zod validation middleware:

```typescript
import { validateBody } from '@pikattp'
import { CreateUserRequest } from '@pikapi/public'

router.post('/users', validateBody(CreateUserRequest), controller.createUser)
```

## Documentation

See `/docs/ZOD_VALIDATION_GUIDE.md` for comprehensive validation documentation.
