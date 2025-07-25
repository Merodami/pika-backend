# Package Architecture Guidelines

## Current Issues

Several packages violate the dependency hierarchy by importing from `@solo60/shared`:

1. **@solo60/redis** - Only imports `logger`
2. **@solo60/database** - Imports `logger` and possibly error utilities
3. **@solo60/http** - Imports various utilities
4. **@solo60/auth** - Imports logger and error handling

## Proper Package Hierarchy

According to industry standards (Clean Architecture, Hexagonal Architecture), packages should be organized in layers:

### Layer 1: Core/Domain (No dependencies)

- **@solo60/types** - Pure TypeScript types and enums ✓
- **@solo60/environment** - Environment variables and constants ✓

### Layer 2: Infrastructure (Depends only on Core)

- **@solo60/logger** - Logging utilities (SHOULD BE CREATED)
- **@solo60/redis** - Redis client and caching
- **@solo60/database** - Database client and models
- **@solo60/http** - HTTP framework utilities

### Layer 3: Domain/Business Logic (Depends on Core + Infrastructure)

- **@solo60/auth** - Authentication logic
- **@solo60/api** - API contracts and schemas

### Layer 4: Application (Depends on all below)

- **@solo60/shared** - Shared application utilities, service clients
- **@solo60/sdk** - SDK and domain mappers

### Layer 5: Services (Depends on all below)

- **@solo60/auth-service**
- **@solo60/user-service**
- **@solo60/payment-service**
- etc.

## Recommended Refactoring

### 1. Create @solo60/logger package

```json
{
  "name": "@solo60/logger",
  "dependencies": {
    "@solo60/environment": "workspace:^",
    "pino": "^9.7.0"
  }
}
```

### 2. Create @solo60/errors package

```json
{
  "name": "@solo60/errors",
  "dependencies": {
    "@solo60/types": "workspace:^"
  }
}
```

### 3. Update dependencies:

- **@solo60/redis** → depends on `@solo60/logger` instead of `@solo60/shared`
- **@solo60/database** → depends on `@solo60/logger` and `@solo60/errors`
- **@solo60/http** → depends on `@solo60/logger` and `@solo60/errors`
- **@solo60/auth** → depends on `@solo60/logger` and `@solo60/errors`

### 4. Keep in @solo60/shared:

- Service clients (UserServiceClient, PaymentServiceClient, etc.)
- High-level application utilities
- Complex business logic helpers

## Benefits

1. **No circular dependencies** - Clear hierarchy
2. **Better build times** - Parallel compilation
3. **Clearer architecture** - Easy to understand dependencies
4. **Reusability** - Infrastructure packages can be used in any project
5. **Testability** - Lower layers can be tested in isolation

## Migration Strategy

1. **Phase 1**: Create `@solo60/logger` package and migrate logger
2. **Phase 2**: Create `@solo60/errors` package and migrate error factories
3. **Phase 3**: Update all packages to use new dependencies
4. **Phase 4**: Clean up `@solo60/shared` to only contain high-level utilities

## Package Dependency Rules

1. **Infrastructure packages** (redis, database, http) should NEVER depend on application packages (shared, sdk)
2. **Domain packages** (auth, types) should NEVER depend on infrastructure or application packages
3. **Application packages** (shared, sdk) can depend on anything below them
4. **Service packages** can depend on anything

## Testing the Architecture

Run this command to check for invalid dependencies:

```bash
# Check if infrastructure packages depend on application packages
grep -l '"@solo60/shared"' packages/{redis,database,http,auth}/package.json

# If any results appear, those are violations
```
