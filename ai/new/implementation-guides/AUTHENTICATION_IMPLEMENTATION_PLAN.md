# Pika Authentication System Implementation Plan

## Overview

This plan outlines the implementation of a secure, industry-standard authentication system for Pika - designed for a mid-size company with solid security practices without over-engineering.

## Current State Analysis

### ✅ What We Have

- **Flutter App**: Auth infrastructure ready (providers, services, JWT handling)
- **API Gateway**: JWT validation middleware available (`@pika/http` package)
- **Database Schema**: Complete user model with authentication fields
- **Firebase Integration**: Custom token generation for real-time features
- **API Schemas**: TypeBox validation for all auth operations
- **Error Handling**: Comprehensive error factory and standardized responses
- **Auth Package**: Existing `@pika/auth` with provider abstraction

### ❌ What's Missing

- **Authentication Service**: Dedicated service for auth operations
- **Password Security**: Hashing, validation, strength requirements
- **JWT Token Management**: Generation, refresh, secure storage
- **Auth Business Logic**: Registration, login, password reset handlers

### ⚠️ Architectural Issues

- **Mixed Concerns**: Authentication logic scattered across user service
- **No Separation**: Auth and user profile management mixed together
- **Provider Integration**: External providers not properly integrated

## Corrected Architecture Design

### Proper Service Separation

```
Flutter App ←→ API Gateway ←→ Auth Service (Authentication)
                     ↓           ↓
              JWT Validation   User Service (Profile Management)
                     ↓           ↓
              Other Services ←→ Database
```

### Service Responsibilities

- **@pika/auth**: Authentication, password management, token operations
- **@pika/user**: User profile, preferences, relationships
- **Clear Boundaries**: No cross-service authentication logic

## Implementation Plan

### Phase 1: Core Backend Authentication (Week 1-2)

#### 1.1 Password Security Service

```typescript
// packages/services/user/src/write/application/services/PasswordService.ts
class PasswordService {
  async hashPassword(password: string): Promise<string>
  async verifyPassword(password: string, hash: string): Promise<boolean>
  validatePasswordStrength(password: string): ValidationResult
}
```

**Features:**

- bcrypt with 12 rounds (industry standard)
- Password strength validation (8+ chars, mixed case, numbers, symbols)
- Timing attack protection

#### 1.2 JWT Token Service

```typescript
// packages/services/user/src/write/application/services/TokenService.ts
class TokenService {
  generateAccessToken(user: User): string
  generateRefreshToken(user: User): string
  verifyToken(token: string): TokenPayload | null
  refreshAccessToken(refreshToken: string): AuthTokens
}
```

**Features:**

- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (longer-lived)
- Secure JWT payload with minimal claims
- Token blacklisting for logout

#### 1.3 User Repository Implementation

```typescript
// packages/services/user/src/write/infrastructure/persistence/UserWriteRepository.ts
class UserWriteRepository implements UserWriteRepositoryPort {
  async create(userData: CreateUserData): Promise<User>
  async findByEmail(email: string): Promise<User | null>
  async updatePassword(userId: string, hashedPassword: string): Promise<void>
  async updateLoginTime(userId: string): Promise<void>
}
```

#### 1.4 Authentication Use Cases

```typescript
// packages/services/user/src/write/application/use_cases/
;-RegisterUserUseCase - LoginUserUseCase - RefreshTokenUseCase - ResetPasswordUseCase - ChangePasswordUseCase
```

#### 1.5 Authentication Routes

```typescript
// packages/services/user/src/write/api/routes/AuthRouter.ts
POST / api / v1 / auth / register
POST / api / v1 / auth / login
POST / api / v1 / auth / refresh
POST / api / v1 / auth / logout
POST / api / v1 / auth / forgot - password
POST / api / v1 / auth / reset - password
POST / api / v1 / auth / change - password
```

### Phase 2: Standardize Service Authentication (Week 2)

#### 2.1 Update Category Service

- Remove `x-admin` header authentication
- Implement proper JWT middleware
- Add role-based access control (RBAC)

#### 2.2 Consistent Auth Middleware

```typescript
// Apply to all services
fastify.addHook('preHandler', fastifyAuth)
```

#### 2.3 Role-Based Access Control

```typescript
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  ADMIN = 'ADMIN',
}

// Middleware for role checking
const requireRole = (roles: UserRole[]) => async (request: FastifyRequest) => {
  if (!roles.includes(request.user.role)) {
    throw ErrorFactory.forbidden('Insufficient permissions')
  }
}
```

### Phase 3: Flutter App Integration (Week 3)

#### 3.1 Remove Static Authentication

- Delete mock login methods from `auth_provider.dart`
- Remove hardcoded JWT token
- Remove static user creation

#### 3.2 Implement Real Authentication

```dart
// lib/core/services/auth/auth_service.dart
class AuthService {
  Future<AuthResponse> login(String email, String password)
  Future<AuthResponse> register(RegisterRequest request)
  Future<AuthResponse> refreshToken()
  Future<void> logout()
  Future<UserModel?> getCurrentUser()
}
```

#### 3.3 Secure Token Storage

```dart
// Enhanced secure storage with encryption
class SecureTokenStorage {
  Future<void> storeTokens(AuthTokens tokens)
  Future<AuthTokens?> getTokens()
  Future<void> clearTokens()
  Future<bool> isTokenValid()
}
```

#### 3.4 Auto Token Refresh

```dart
// Dio interceptor for automatic token refresh
class AuthInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler)
  // Handle 401 errors with automatic token refresh
}
```

### Phase 4: Security Enhancements (Week 4)

#### 4.1 Rate Limiting

```typescript
// Apply to auth endpoints
const authRateLimit = {
  max: 5, // 5 attempts
  timeWindow: '15 minutes',
  keyGenerator: (request) => request.ip + request.body.email,
}
```

#### 4.2 Account Security

- Account lockout after failed attempts
- Password reset token expiration
- Email verification for new accounts
- Security event logging

#### 4.3 Input Validation & Sanitization

```typescript
// Enhanced validation schemas
const RegisterSchema = Type.Object({
  email: Type.String({ format: 'email', maxLength: 255 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  firstName: Type.String({ minLength: 1, maxLength: 100 }),
  lastName: Type.String({ minLength: 1, maxLength: 100 }),
})
```

#### 4.4 Security Headers

```typescript
// Helmet configuration for security headers
fastify.register(helmet, {
  contentSecurityPolicy: false, // Configure as needed
  hsts: { maxAge: 31536000 },
  noSniff: true,
  xssFilter: true,
})
```

### Phase 5: Monitoring & Logging (Week 4)

#### 5.1 Authentication Events

```typescript
enum AuthEvent {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password_reset',
  TOKEN_REFRESH = 'token_refresh',
  LOGOUT = 'logout',
}
```

#### 5.2 Security Monitoring

- Failed login attempt tracking
- Suspicious activity detection
- Token usage monitoring
- Account lockout alerts

#### 5.3 Audit Logging

```typescript
interface AuthAuditLog {
  userId?: string
  event: AuthEvent
  ipAddress: string
  userAgent: string
  timestamp: Date
  success: boolean
  failureReason?: string
}
```

## Security Specifications

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common passwords (dictionary check)

### JWT Configuration

```typescript
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'pika-api',
  audience: 'pika-app',
}
```

### Rate Limiting

- Login attempts: 5 per 15 minutes per IP + email
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- Token refresh: 10 per minute per user

### Account Security

- Account lockout: 5 failed attempts
- Lockout duration: 30 minutes (progressive)
- Password reset token: 1 hour expiry
- Email verification: 24 hour expiry

## API Specification

### Authentication Endpoints

#### POST /api/v1/auth/register

```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}

Response:
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/v1/auth/login

```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/v1/auth/refresh

```json
Request:
{
  "refreshToken": "eyJ..."
}

Response:
{
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

## Testing Strategy

### Unit Tests

- Password hashing/verification
- JWT token generation/validation
- User repository operations
- Authentication use cases

### Integration Tests

- Authentication flow end-to-end
- Token refresh workflow
- Password reset process
- Role-based access control

### Security Tests

- Password strength validation
- Rate limiting effectiveness
- JWT token security
- Input validation/sanitization

### Load Tests

- Authentication endpoint performance
- Concurrent login handling
- Token refresh under load

## Environment Configuration

### Development

```env
JWT_SECRET=dev-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PASSWORD_SALT_ROUNDS=12
RATE_LIMIT_ENABLED=true
ACCOUNT_LOCKOUT_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=false
```

### Production

```env
JWT_SECRET=<strong-random-256-bit-key>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PASSWORD_SALT_ROUNDS=12
RATE_LIMIT_ENABLED=true
ACCOUNT_LOCKOUT_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=true
```

## Migration Strategy

### Phase 1: Backend Implementation

1. Implement password service with bcrypt
2. Create JWT token service
3. Build user repository CRUD operations
4. Develop authentication use cases
5. Create authentication routes

### Phase 2: Service Standardization

1. Update category service to use JWT middleware
2. Implement RBAC across all services
3. Remove legacy authentication patterns

### Phase 3: Flutter Integration

1. Remove static/mock authentication
2. Implement real API authentication
3. Add automatic token refresh
4. Enhance secure storage

### Phase 4: Security Hardening

1. Add rate limiting and account lockout
2. Implement security monitoring
3. Add comprehensive audit logging
4. Security testing and validation

## Success Metrics

### Security Metrics

- Zero authentication bypasses
- No password storage in plain text
- All requests properly authenticated
- Rate limiting effectiveness

### Performance Metrics

- Login response time < 500ms
- Token refresh < 200ms
- 99.9% authentication availability
- Minimal impact on API performance

### User Experience Metrics

- Seamless login experience
- Automatic token refresh (transparent)
- Clear error messages
- Secure but user-friendly flows

## Deliverables

### Code Deliverables

1. **Backend Authentication Service** - Complete user service with auth endpoints
2. **JWT Middleware Integration** - Consistent auth across all services
3. **Flutter Auth Client** - Real API integration replacing static auth
4. **Security Enhancements** - Rate limiting, validation, monitoring
5. **Comprehensive Tests** - Unit, integration, and security tests

### Documentation Deliverables

1. **API Documentation** - OpenAPI specs for all auth endpoints
2. **Security Guide** - Authentication and authorization guidelines
3. **Integration Guide** - How to add auth to new services
4. **Deployment Guide** - Environment configuration and secrets management

This plan provides a solid, secure authentication system suitable for a mid-size company without over-engineering, following industry standards and best practices.
