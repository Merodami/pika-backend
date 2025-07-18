# Authentication Architecture Analysis & Best Practices

## Current Architecture Overview

The Solo60 platform currently implements a microservices architecture with:

- **Auth Service**: Handles authentication logic (login, register, password reset)
- **User Service**: Manages user data and profiles
- **API Gateway**: Routes requests and validates JWT tokens

## Industry Standard Patterns Analysis

### 1. **Authentication vs Authorization**

**Authentication** (Who are you?)

- Handled by Auth Service
- Verifies credentials
- Issues tokens

**Authorization** (What can you do?)

- Handled by API Gateway + individual services
- Validates tokens
- Checks permissions

### 2. **Data Access Patterns**

#### Pattern A: Repository Pattern with Multiple Return Types (Current Approach)

```typescript
interface UserRepository {
  findById(id: string): Promise<UserDomain> // Business object
  findByIdRaw(id: string): Promise<UserEntity> // Database entity
}
```

**Pros:**

- Clear separation between business and persistence layers
- Type safety for different use cases
- Explicit about what data is returned

**Cons:**

- Method proliferation
- Potential confusion about which method to use

#### Pattern B: Repository with Projection/Options (Industry Standard)

```typescript
interface UserRepository {
  findById(
    id: string,
    options?: {
      includePassword?: boolean
      includeSensitive?: boolean
      projection?: string[]
    },
  ): Promise<User>
}
```

**Pros:**

- Single method with flexible options
- Reduces method count
- More maintainable

**Cons:**

- Less type safety
- Runtime decisions about data shape

#### Pattern C: Separate Repositories (Clean Architecture)

```typescript
interface UserRepository {
  findById(id: string): Promise<UserDomain>
}

interface AuthRepository {
  findUserWithCredentials(email: string): Promise<UserWithPassword>
}
```

**Pros:**

- Clear separation of concerns
- Each repository has single responsibility
- Type-safe and explicit

**Cons:**

- More classes/interfaces
- Potential code duplication

### 3. **Service Communication Patterns**

#### Anti-Pattern: Direct Database Access Across Services ❌

```
Auth Service → User Service Database
```

#### Pattern: Service-to-Service Communication ✅

```
Auth Service → User Service API → User Database
```

### 4. **Password Handling Best Practices**

#### Industry Standards:

1. **Never include passwords in domain models**
2. **Use separate DTOs for auth-specific operations**
3. **Hash passwords at the boundary (controller/service layer)**
4. **Never log or serialize passwords**

## Recommended Architecture

### 1. **Domain Model Separation**

```typescript
// Domain Models (Business Logic)
interface UserDomain {
  id: string
  email: string
  firstName: string
  lastName: string
  // NO PASSWORD
}

// Persistence Models (Database)
interface UserEntity {
  id: string
  email: string
  password: string | null
  firstName: string
  lastName: string
}

// DTOs (Data Transfer)
interface UserAuthData {
  id: string
  email: string
  passwordHash: string
  status: UserStatus
}
```

### 2. **Repository Pattern Implementation**

```typescript
// User Repository (Business Operations)
class UserRepository {
  async findById(id: string): Promise<UserDomain | null> {
    const entity = await this.prisma.user.findUnique({ where: { id } })
    return entity ? UserMapper.toDomain(entity) : null
  }

  async findByEmail(email: string): Promise<UserDomain | null> {
    const entity = await this.prisma.user.findUnique({ where: { email } })
    return entity ? UserMapper.toDomain(entity) : null
  }
}

// Auth Data Repository (Internal API)
class UserAuthRepository {
  async findAuthDataByEmail(email: string): Promise<UserAuthData | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
        emailVerified: true,
      },
    })
    return user ? this.toAuthData(user) : null
  }
}
```

### 3. **Service Layer Organization**

```typescript
// Public User Service
class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: string): Promise<UserDomain> {
    return this.userRepo.findById(id)
  }
}

// Internal User Service (for Auth Service)
class InternalUserService {
  constructor(
    private userRepo: UserRepository,
    private authRepo: UserAuthRepository,
  ) {}

  async getUserAuthData(email: string): Promise<UserAuthData> {
    return this.authRepo.findAuthDataByEmail(email)
  }
}
```

### 4. **API Organization**

```
/users/:id          → UserController → UserService → UserRepository
/internal/users/auth → InternalUserController → InternalUserService → UserAuthRepository
```

## Implementation Plan

### Phase 1: Repository Refactoring

1. Create `UserAuthRepository` for auth-specific data access
2. Move auth-related queries from `UserRepository` to `UserAuthRepository`
3. Ensure `UserRepository` only returns `UserDomain` objects

### Phase 2: Service Layer Cleanup

1. Update `InternalUserService` to use `UserAuthRepository`
2. Ensure clear separation between public and internal operations
3. Add proper error handling for auth-specific scenarios

### Phase 3: Type Safety Improvements

1. Create explicit types for auth data (`UserAuthData`)
2. Remove `any` types from repository interfaces
3. Add proper type guards and validation

### Phase 4: Testing

1. Unit tests for repositories with mocked Prisma
2. Integration tests for internal API endpoints
3. E2E tests for auth flows

## Security Considerations

1. **Password Storage**
   - Use bcrypt with salt rounds >= 10
   - Never store plain text passwords
   - Consider migrating to Argon2

2. **Token Management**
   - Short-lived access tokens (15-30 minutes)
   - Longer refresh tokens (7-30 days)
   - Token rotation on refresh
   - Blacklist/revoke tokens on logout

3. **Service Communication**
   - Use service-to-service authentication (API keys)
   - Implement request signing for critical operations
   - Use TLS for all internal communication

4. **Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Progressive delays for failed attempts
   - Account lockout after repeated failures

## Monitoring & Observability

1. **Metrics to Track**
   - Login success/failure rates
   - Token refresh patterns
   - Service communication latency
   - Database query performance

2. **Logging**
   - Log auth events (without passwords)
   - Track service-to-service calls
   - Monitor unusual patterns

3. **Alerting**
   - High failure rates
   - Unusual traffic patterns
   - Service communication failures

## Migration Strategy

1. **Step 1**: Implement new repositories alongside existing code
2. **Step 2**: Gradually migrate services to use new repositories
3. **Step 3**: Add comprehensive tests
4. **Step 4**: Remove old code after validation
5. **Step 5**: Monitor and optimize

## Conclusion

The recommended approach is to:

1. Use separate repositories for different concerns (business vs auth)
2. Keep domain models clean (no passwords)
3. Use explicit types for different data shapes
4. Maintain clear API boundaries between services

This provides:

- Better security (passwords isolated to auth operations)
- Clearer code organization
- Type safety
- Easier testing and maintenance
