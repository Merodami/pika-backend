# OAuth 2.0 Migration Guide

This guide helps frontend developers migrate from the old authentication endpoints to the new OAuth 2.0 standard endpoints.

## Endpoint Changes

### 1. Login → Token Endpoint

**Old Endpoint:**

```
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**New OAuth Endpoint:**

```
POST /auth/token
{
  "grantType": "password",
  "username": "user@example.com",  // Note: username, not email
  "password": "password123"
}
```

**Response Changes:**

```typescript
// Old Response
{
  "user": { ... },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}

// New OAuth Response
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "scope": "read write",
  "user": { ... }  // Flattened structure
}
```

### 2. Refresh Token

**Old Endpoint:**

```
POST /auth/refresh
{
  "refreshToken": "..."
}
```

**New OAuth Endpoint:**

```
POST /auth/token
{
  "grantType": "refreshToken",  // Note: camelCase
  "refreshToken": "..."
}
```

### 3. Logout → Revoke Token

**Old Endpoint:**

```
POST /auth/logout
Authorization: Bearer <token>
```

**New OAuth Endpoint:**

```
POST /auth/revoke
{
  "token": "<access_token>",
  "allDevices": false  // Optional: revoke all tokens
}
```

### 4. New: Token Introspection

Check if a token is still valid:

```
POST /auth/introspect
{
  "token": "<access_token>"
}
```

Response:

```typescript
{
  "active": true,
  "scope": "read write",
  "username": "user@example.com",
  "exp": 1234567890,
  "sub": "user-id"
}
```

### 5. New: User Info Endpoint

Get authenticated user information:

```
GET /auth/userinfo
Authorization: Bearer <token>
```

## Frontend Session Type Update

Update your Session interface:

```typescript
// Old
interface Session {
  user: AuthUserResponse
  token: string // Changed
  error?: string
}

// New
interface Session {
  user: AuthUserResponse
  accessToken: string // OAuth standard naming
  refreshToken?: string // Optional refresh token
  error?: string
}
```

## SDK Usage Examples

### Login

```typescript
// Using api-microservices-sdk
const response = await authClient.token({
  grantType: 'password',
  username: email,
  password: password,
})

// Store session
const session: Session = {
  user: response.user,
  accessToken: response.accessToken,
  refreshToken: response.refreshToken,
}
```

### Refresh Token

```typescript
const response = await authClient.token({
  grantType: 'refreshToken',
  refreshToken: session.refreshToken,
})

// Update tokens
session.accessToken = response.accessToken
session.refreshToken = response.refreshToken
```

### Logout

```typescript
await authClient.revoke({
  token: session.accessToken,
})

// Clear session
session = null
```

### Check Token Validity

```typescript
const introspection = await authClient.introspect({
  token: session.accessToken,
})

if (!introspection.active) {
  // Token expired, refresh or re-login
}
```

## Benefits of OAuth 2.0 Migration

1. **Industry Standard**: Compatible with OAuth providers (Google, Facebook, Cognito)
2. **Better Security**: Token introspection and revocation
3. **Future Ready**: Easy integration with AWS Cognito
4. **Consistent API**: Same patterns as other OAuth services

## Backwards Compatibility

During the migration period:

- Old endpoints are removed to avoid confusion
- Use only the new OAuth endpoints
- All new features use OAuth patterns

## Error Handling

OAuth endpoints follow RFC 6749 error responses:

```typescript
{
  "error": "invalid_grant",
  "error_description": "Invalid credentials"
}
```

Common error codes:

- `invalid_request` - Missing required parameters
- `invalid_grant` - Wrong credentials or expired token
- `invalid_token` - Token validation failed
- `unsupported_grant_type` - Invalid grantType value
