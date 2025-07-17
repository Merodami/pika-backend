# Authentication Flow Documentation

## Overview

This document describes the authentication flow implementation in the Pika platform based on integration test results and API behavior analysis.

## Authentication Endpoints

### 1. User Registration (`POST /auth/register`)

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Test User",
  "phone": "+1234567890"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Test User",
    "phone": "+1234567890",
    "createdAt": "2025-01-06T12:00:00.000Z",
    "updatedAt": "2025-01-06T12:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

**Key Behaviors:**

- Creates new user in database
- Hashes password using bcrypt
- Returns JWT tokens immediately upon successful registration
- Access token expires in 15 minutes (900 seconds)
- Refresh token expires in 7 days

### 2. User Login (`POST /auth/login`)

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Test User",
    "phone": "+1234567890",
    "createdAt": "2025-01-06T12:00:00.000Z",
    "updatedAt": "2025-01-06T12:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

**Key Behaviors:**

- Validates email/password combination
- Returns 401 for invalid credentials
- Returns same token structure as registration
- Updates last login timestamp (if implemented)

### 3. Token Refresh (`POST /auth/refresh`)

**Request:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900
}
```

**Key Behaviors:**

- Validates refresh token
- Returns 401 for invalid/expired refresh tokens
- Issues new access token with fresh expiration
- May optionally rotate refresh token for security

### 4. User Logout (`POST /auth/logout`)

**Request:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

**Key Behaviors:**

- Invalidates the provided refresh token
- Should be called by clients when user logs out
- Prevents refresh token reuse

## JWT Token Structure

### Access Token Claims

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1704547200,
  "exp": 1704548100,
  "type": "access"
}
```

### Refresh Token Claims

```json
{
  "sub": "user-uuid",
  "iat": 1704547200,
  "exp": 1705152000,
  "type": "refresh"
}
```

## Authentication Middleware

The authentication middleware extracts and validates tokens from requests:

1. **Token Extraction:**
   - Looks for `Authorization: Bearer <token>` header
   - Validates token format and signature
   - Extracts user information from token claims

2. **User Context:**
   - Sets `x-user-id` header with the user's UUID
   - Makes user ID available to downstream services
   - Controllers access via `request.headers['x-user-id']`

## Error Responses

### Registration Errors

**Email Already Exists (409 Conflict):**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Email already registered"
}
```

**Validation Error (400 Bad Request):**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "password": "Password must be at least 8 characters"
  }
}
```

### Login Errors

**Invalid Credentials (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

### Token Errors

**Invalid/Expired Token (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

## Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, number, and special character
   - Stored as bcrypt hash with salt rounds of 10

2. **Token Security:**
   - Access tokens have short lifespan (15 minutes)
   - Refresh tokens stored securely and can be revoked
   - Tokens signed with secure secret key
   - HTTPS required in production

3. **Rate Limiting:**
   - Login attempts should be rate-limited
   - Token refresh endpoints should have reasonable limits
   - Consider implementing account lockout after failed attempts

## Integration with Services

Services that require authentication should:

1. **Extract User Context:**

   ```typescript
   const userId = request.headers['x-user-id'] as string
   ```

2. **Map User to Domain Entities:**

   ```typescript
   // In use case/handler
   const serviceProviderId = await this.providerRepo.findProviderByUserId(userId)
   if (!serviceProviderId) {
     throw new NotAuthorizedError('User is not a service provider')
   }
   ```

3. **Handle Authorization:**
   - Check if user has required role/permissions
   - Verify ownership of resources
   - Apply business rules for access control

## Client Implementation Guidelines

1. **Token Storage:**
   - Store tokens securely (Keychain on iOS, Keystore on Android, secure storage on web)
   - Never store tokens in plain text
   - Clear tokens on logout

2. **Token Renewal:**
   - Monitor token expiration
   - Refresh token before expiration
   - Handle 401 responses by attempting token refresh
   - Re-authenticate if refresh fails

3. **Request Headers:**
   ```
   Authorization: Bearer <access_token>
   Content-Type: application/json
   ```

## Testing Authentication

Integration tests demonstrate the complete flow:

```typescript
// Register new user
const registerResponse = await request(app).post('/auth/register').send({
  email: 'test@example.com',
  password: 'Test123!@#',
  name: 'Test User',
  phone: '+1234567890',
})

// Use access token for authenticated requests
const token = registerResponse.body.tokens.accessToken

const authenticatedRequest = await request(app).get('/protected-endpoint').set('Authorization', `Bearer ${token}`)
```

## Migration from Previous System

For services migrating from direct user ID usage:

1. Update controllers to extract user ID from headers
2. Move user-to-entity mapping logic to use cases
3. Ensure repositories have methods to lookup by user ID
4. Update tests to include proper authentication

## Monitoring and Debugging

Key metrics to monitor:

- Failed login attempts
- Token refresh rates
- Token expiration events
- Registration success/failure rates
- Average session duration

Log important events:

- Successful/failed authentication attempts
- Token generation and refresh
- Suspicious activity patterns
- Authorization failures
