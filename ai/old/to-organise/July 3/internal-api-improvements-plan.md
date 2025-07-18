# Internal API Improvements Plan

Based on my analysis of the internal API implementation patterns across the Solo60 platform, I've identified the current standards and areas for improvement:

## Current Implementation Analysis

### 1. Authentication Pattern

- **Service-to-Service Auth**: Uses API key authentication via `x-api-key` header
- **Middleware**: `requireServiceAuth()` validates API keys and service identification
- **Headers Required**: `x-api-key`, `x-service-name`, `x-service-id`
- **No JWT/Bearer tokens** for internal APIs - simpler and more appropriate

### 2. Request Parameter Patterns

- **Mixed approach**:
  - URL parameters for resource identifiers (e.g., `/auth/:id`, `/by-user/:userId`)
  - Request body for complex data (create, update operations)
  - Query parameters for optional filters (e.g., `?includeInactive=true`)
- **Body validation**: Uses Zod schemas with `validateBody()` middleware

### 3. Response Status Codes

- **201**: For resource creation (createUser)
- **204**: For successful operations with no content (updateLastLogin, verifyEmail)
- **200**: For successful data retrieval (implicit via res.json())
- **Error handling**: Via Express error middleware (next(error))

### 4. Password Handling

- **Current Issue**: Schema expects `passwordHash` but service accepts both `password` and `passwordHash`
- **Industry Standard**: Internal APIs should only receive hashed passwords
- **Token-based flows**: For password resets and email verification (not fully implemented)

### 5. Token Management

- **Current**: Password reset and email verification endpoints return 401 (not implemented)
- **Expected**:
  - Redis-backed tokens with TTL
  - Secure random generation: `randomBytes(32).toString('hex')`
  - Namespace prefixing: `password-reset:`, `email-verification:`
  - Auto-cleanup after successful validation

## Recommended Improvements

### 1. Complete Token Management Implementation

```typescript
// Token generation
async createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const key = `password-reset:${token}`;
  await this.cache.set(key, userId, PASSWORD_RESET_TOKEN_TTL);
  return token;
}

// Token validation
async validatePasswordResetToken(token: string): Promise<string> {
  const key = `password-reset:${token}`;
  const userId = await this.cache.get(key);
  if (!userId) {
    throw ErrorFactory.unauthorized('Invalid or expired token');
  }
  return userId;
}

// Token invalidation
async invalidatePasswordResetToken(token: string): Promise<void> {
  const key = `password-reset:${token}`;
  await this.cache.delete(key);
}
```

### 2. Standardize Request Parameter Usage

- **Resource IDs**: Always use URL parameters (not request body)
- **Update operations**: Only include data being changed in request body
- **Examples**:

  ```typescript
  // GOOD: ID in URL, only changed data in body
  router.post('/:id/password', validateBody(UpdatePasswordRequest), controller.updatePassword)

  // BAD: ID in request body
  router.post('/password', validateBody(UpdatePasswordRequestWithId), controller.updatePassword)
  ```

### 3. Fix Password Handling Consistency

- **Remove dual password handling** in service
- **Only accept `passwordHash`** in internal APIs
- **Auth service** is the only service that should hash passwords
- **Update schema** to be consistent:
  ```typescript
  export const UpdatePasswordRequest = z.object({
    hashedPassword: z.string(), // Remove userId, use URL param
  })
  ```

### 4. Standardize Response Status Codes

- **200 OK**: When returning data (including success messages)
- **201 Created**: When creating new resources
- **204 No Content**: When operation succeeds with no response body
- **Fix verify-email** to return consistent status:
  ```typescript
  // If returning success message
  res.status(200).json({ success: true })
  // If no response body
  res.status(204).send()
  ```

### 5. Add Response Consistency

```typescript
// Standardized success response
interface InternalAPIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  timestamp: string
  correlationId?: string
}

// Example usage
res.status(200).json({
  success: true,
  data: { token },
  timestamp: new Date().toISOString(),
  correlationId: req.headers['x-correlation-id'],
})
```

### 6. Enhanced Error Handling

```typescript
// Consistent error responses for internal APIs
interface InternalAPIError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  correlationId?: string
}
```

### 7. Add Request Validation for URL Parameters

```typescript
// Validate UUID parameters
router.get('/auth/:id', validateParams(z.object({ id: UserId })), controller.getUserAuthData)
```

### 8. Implement Idempotency for Critical Operations

```typescript
// Use idempotency keys for operations that modify state
router.post('/:id/password-reset-token', requireIdempotencyKey(), validateBody(CreatePasswordResetTokenRequest), controller.createPasswordResetToken)
```

## Implementation Priority

1. **High Priority** (Breaking changes, security):
   - Complete token management implementation
   - Fix password handling to only accept hashes
   - Standardize request parameters (remove userId from body where it's in URL)

2. **Medium Priority** (Consistency, best practices):
   - Standardize response status codes
   - Add consistent response structure
   - Validate URL parameters

3. **Low Priority** (Nice to have):
   - Add idempotency for critical operations
   - Enhanced error response structure
   - Request correlation tracking

## Migration Strategy

1. **Phase 1**: Fix critical issues
   - Implement token management
   - Update password handling
   - Fix request parameter patterns

2. **Phase 2**: Add consistency
   - Standardize responses
   - Add parameter validation
   - Update tests

3. **Phase 3**: Enhance
   - Add idempotency
   - Improve observability
   - Add documentation

## Testing Considerations

- Update integration tests to match new patterns
- Add tests for token lifecycle
- Ensure backward compatibility where needed
- Test error scenarios thoroughly
