# Authentication Frontend Migration Plan

## Current State Analysis

### Existing Implementation

- **Consistent camelCase naming** throughout the API (no snake_case issues)
- **Well-structured auth system** with JWT tokens, refresh tokens, and proper middleware
- **Multiple auth touchpoints**:
  - Auth Service (main authentication logic)
  - JWT Token Service (token management)
  - Auth Middleware (request validation)
  - Request Context (user context propagation)
  - Frontend SDK with interceptors

### Current API Structure

```typescript
// Login Response (current - already good)
{
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    profilePicture?: string,
    role: 'USER' | 'TRAINER'
  },
  tokens: {
    accessToken: string,
    refreshToken: string,
    tokenType: 'Bearer',
    expiresIn: number
  }
}
```

## Migration Goals

1. **Maintain backward compatibility** - No breaking changes for existing frontend
2. **Add OAuth 2.0 compliant endpoints** alongside existing ones
3. **Improve frontend Session type** for better state management
4. **Enhance security** with token introspection and proper revocation

## Migration Plan

### Phase 1: Backend Enhancements (No Breaking Changes)

#### 1.1 Add OAuth-Compatible Schemas (camelCase)

Create new schemas that follow OAuth 2.0 patterns but maintain our camelCase convention:

```typescript
// New OAuth-compatible token request (camelCase)
export const TokenRequest = z.discriminatedUnion('grantType', [
  z.object({
    grantType: z.literal('password'),
    username: Email,
    password: z.string(),
    scope: z.string().optional(),
  }),
  z.object({
    grantType: z.literal('refreshToken'),
    refreshToken: JWTToken,
    scope: z.string().optional(),
  }),
])

// New OAuth-compatible token response (camelCase)
export const TokenResponse = z.object({
  accessToken: JWTToken,
  tokenType: z.literal('Bearer'),
  expiresIn: z.number(),
  refreshToken: JWTToken.optional(),
  scope: z.string().optional(),
  // Include user for convenience (not standard OAuth)
  user: AuthUserResponse.optional(),
})
```

#### 1.2 Add New Endpoints (Parallel to Existing)

- Keep `/auth/login` → Add `/auth/token` with OAuth format
- Keep `/auth/refresh` → Use `/auth/token` with refreshToken grant
- Keep `/auth/logout` → Add `/auth/revoke` for token revocation
- Add `/auth/introspect` for token validation
- Add `/auth/userinfo` for getting user details from token

#### 1.3 Update Auth Controller

- Add new methods for OAuth endpoints
- Reuse existing AuthService logic
- Map between old and new response formats
