# Code Cleanup Proposal

This document outlines areas identified for cleanup in the Pika codebase based on a comprehensive analysis of code patterns, naming conventions, and best practices.

## 1. Debug Console Statements

### Production Code with Console.log/warn

Remove debug console statements from production code:

- **`packages/services/service/src/read/api/controllers/service/ServiceController.ts`** (lines 66, 74, 96)

  ```typescript
  console.log('result', result)
  console.log('dtoResult', dtoResult)
  console.log('processedResult', processedResult)
  ```

- **`packages/auth/src/services/JwtTokenService.ts`** (lines 295, 320, 438, 502)
  ```typescript
  console.warn('Failed to store token blacklist in Redis, using memory fallback:', error)
  console.log(`Revoked ${deletedCount} tokens for user ${userId}`)
  console.warn('Redis blacklist check failed, falling back to memory:', error)
  console.warn('Failed to store refresh token metadata:', error)
  ```
  **Action**: Replace with proper logger service calls

## 2. TODO/FIXME Comments

### High Priority Security TODOs

- **`packages/services/notification/src/write/api/controllers/NotificationController.ts`** (lines 46-50)
  ```typescript
  // TODO: In production, implement proper service-to-service authentication
  // Options:
  // 1. Use internal API tokens with x-internal-service header
  // 2. Implement service mesh with mTLS
  // 3. Use API Gateway to restrict access to internal services only
  ```
  **Action**: Implement proper service-to-service authentication

### Technical Debt TODOs

- **`packages/services/service/src/write/api/routes/ServiceRouter.ts`** (line 75)
  ```typescript
  // ToDo: Check this
  // Temporarily remove response schema validation to avoid ServiceImage reference issues
  ```
  **Action**: Fix ServiceImage schema reference and re-enable response validation

## 3. Unused Imports

### NotificationController.ts

Remove unused imports:

- `NotAuthorizedError` (line 3) - imported but never used
- `UserRole` (line 4) - imported but never used

## 4. Duplicate Code Patterns

### Language Header Function

The following function is duplicated across multiple routers:

```typescript
function setLanguageHeader(request: FastifyRequest, reply: FastifyReply): void {
  const language = getPreferredLanguage(request)
  if (language && language !== 'all') {
    reply.header('Content-Language', language)
  }
}
```

**Found in:**

- `packages/services/notification/src/read/api/routes/NotificationRouter.ts`
- `packages/services/booking/src/read/api/routes/BookingReadRouter.ts`
- (Likely in other read routers)

**Action**: Extract to a shared middleware utility

### Error Handling Pattern

Similar error handling blocks are duplicated across all controllers:

```typescript
} catch (error: any) {
  logger.error('Error [action]:', {
    error: error.message,
    stack: error.stack,
    context: error.context,
    // ... specific metadata
  })
  // Handle specific error types
  // Handle unexpected errors
}
```

**Action**: Create a shared error handling decorator or utility

## 5. Inconsistent Patterns

### Authentication Middleware

Some routers implement authentication and language headers, while others don't:

- **With auth/language**: Notification, Booking read routers
- **Without**: Messaging routers (ConversationRouter, MessageRouter)

**Action**: Standardize authentication middleware usage across all routers

### Controller Directory Structure

Inconsistent organization:

- **Subdirectories**: `controllers/category/CategoryController.ts`
- **Flat structure**: `controllers/NotificationController.ts`, `controllers/FirebaseAuthController.ts`

**Action**: Choose one pattern and apply consistently

### Schema File Naming

Mixed naming conventions in `packages/api/src/schemas`:

- camelCase: `tokenExchange.ts`
- kebab-case: `firebase-auth.ts`
- lowercase: `user.ts`, `auth.ts`, `booking.ts`

**Action**: Standardize to camelCase for multi-word schema files

## 6. Disabled Response Validation

Multiple routes have commented-out response schema validation in:

- **`packages/services/service/src/write/api/routes/ServiceRouter.ts`**
  ```typescript
  // response: { 201: schemas.ServiceSchema },  // line 77
  // response: { 200: schemas.ServiceSchema },  // lines 97, 131
  ```

**Action**: Fix the underlying ServiceImage schema issue and re-enable validation

## 7. Empty Barrel Exports

While many index.ts files are minimal (< 100 bytes), they serve as barrel exports which is a valid pattern. No action needed.

## Implementation Priority

1. **High Priority** (Security & Production Issues)
   - Remove console.log statements from production code
   - Implement service-to-service authentication
   - Replace console.warn with proper logging

2. **Medium Priority** (Code Quality)
   - Extract duplicate setLanguageHeader function
   - Create shared error handling utility
   - Fix ServiceImage schema and re-enable response validation
   - Remove unused imports

3. **Low Priority** (Consistency)
   - Standardize controller directory structure
   - Unify schema file naming conventions
   - Apply consistent authentication middleware

## Estimated Impact

- **Code Reduction**: ~200-300 lines from deduplication
- **Security Improvement**: Proper service authentication
- **Maintainability**: Consistent patterns reduce cognitive load
- **Performance**: Minor improvement from removing console statements

## Next Steps

1. Create shared utilities package for:
   - Language header middleware
   - Error handling utilities
   - Common authentication patterns

2. Run automated tools:
   - ESLint rule for console statements
   - Import cleanup with `eslint-plugin-unused-imports`
   - Naming convention enforcement

3. Document decisions:
   - Controller structure pattern
   - Naming conventions
   - Authentication requirements per endpoint type
