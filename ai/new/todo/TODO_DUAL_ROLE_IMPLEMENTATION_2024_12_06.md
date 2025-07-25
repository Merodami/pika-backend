# TODO: Dual Role Implementation (Customer + Retailer Support)

**Created:** December 6, 2024  
**Status:** Planning Phase  
**Priority:** High  
**Estimated Effort:** 6-8 weeks

## Executive Summary

Currently, the Pika platform **does not support users being both customers and retailers simultaneously**. This limitation is enforced at multiple architectural levels:

- **Database schema** with unique constraints preventing dual profiles
- **Authentication system** with single-role JWT tokens
- **Business logic** with mutually exclusive role checks
- **Frontend/mobile** with single-role state management

This document outlines a comprehensive implementation plan to enable dual role support while maintaining system integrity and user experience.

## 🔴 Critical Blockers Identified

### 1. Database Schema Constraints

- **Location**: `packages/database/prisma/models/`
- **Issue**: Unique constraints on `Customer.userId` and `Retailer.userId`
- **Impact**: Physical impossibility for users to have both profiles

### 2. JWT Token Structure

- **Location**: `packages/auth/src/services/JwtTokenService.ts`
- **Issue**: Single `role` field in token payload
- **Impact**: No role switching capability, session limitations

### 3. Authentication Middleware

- **Location**: `packages/http/src/infrastructure/fastify/middleware/auth.ts`
- **Issue**: Exclusive role guards (`requireCustomer()`, `requireRetailer()`)
- **Impact**: Dual-role users blocked from accessing endpoints

### 4. Business Logic Patterns

- **Location**: Throughout all services
- **Issue**: `if (role === CUSTOMER) {} else if (role === RETAILER) {}`
- **Impact**: Logic fails for users with multiple roles

## 📋 Implementation Plan

### Phase 1: Database Schema Migration (Week 1-2)

#### 1.1 Schema Design Decision

**Recommended Approach: Role Array with Profile Tables**

```prisma
// Enhanced User model
model User {
  id                String            @id @default(dbgenerated("gen_random_uuid()"))
  email             String            @unique
  // ... existing fields
  roles             UserRole[]        @default([CUSTOMER]) // ARRAY OF ROLES
  primaryRole       UserRole          @default(CUSTOMER)   // DEFAULT ACTIVE ROLE

  // Relations (modified)
  customers         Customer[]        // One-to-many
  serviceProviders  ServiceProvider[] // One-to-many
  // ... other relations
}

// Modified Customer model (remove unique constraint)
model Customer {
  id              String          @id @default(dbgenerated("gen_random_uuid()"))
  userId          String          @map("user_id") @db.Uuid // REMOVED @unique
  profileId       String          @unique @default(dbgenerated("gen_random_uuid()")) // NEW
  preferences     Json?
  isActive        Boolean         @default(true) // NEW
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @default(now()) @updatedAt
  deletedAt       DateTime?

  user            User            @relation(fields: [userId], references: [id])

  @@index([userId, isActive])
  @@map("customers")
}

// Modified ServiceProvider model (remove unique constraint)
model ServiceProvider {
  id                  String          @id @default(dbgenerated("gen_random_uuid()"))
  userId              String          @map("user_id") @db.Uuid // REMOVED @unique
  profileId           String          @unique @default(dbgenerated("gen_random_uuid()")) // NEW
  businessName        Json            @map("business_name")
  businessDescription Json            @map("business_description")
  categoryId          String          @map("category_id") @db.Uuid
  verified            Boolean         @default(false)
  isActive            Boolean         @default(true) // NEW
  avgRating           Decimal?        @map("avg_rating") @db.Decimal(3, 2)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @default(now()) @updatedAt
  deletedAt           DateTime?

  user                User            @relation(fields: [userId], references: [id])
  category            Category        @relation(fields: [categoryId], references: [id])

  @@index([userId, isActive])
  @@map("providers")
}
```

#### 1.2 Migration Scripts

**Files to Create:**

- `packages/database/prisma/migrations/YYYYMMDD_add_dual_role_support.sql`
- `packages/database/src/migrations/dualRoleMigration.ts`

**Migration Strategy:**

1. **Phase 1A**: Add new columns with defaults
2. **Phase 1B**: Data migration for existing users
3. **Phase 1C**: Remove old constraints
4. **Phase 1D**: Add new indexes

#### 1.3 Database Tasks

- [ ] **Design final schema** with dual role support
- [ ] **Create migration scripts** for zero-downtime deployment
- [ ] **Update Prisma schema** files
- [ ] **Test migrations** on staging database
- [ ] **Create rollback procedures** for emergency revert
- [ ] **Update database seeding** scripts for dual roles
- [ ] **Verify foreign key integrity** after migration

### Phase 2: Authentication System Overhaul (Week 2-3)

#### 2.1 JWT Token Structure Updates

**File**: `packages/auth/src/services/JwtTokenService.ts`

```typescript
export interface TokenPayload {
  userId: string
  email: string
  roles: UserRole[] // CHANGED: Array of roles
  activeRole: UserRole // NEW: Currently selected role
  permissions: string[] // NEW: Computed permissions
  profiles: {
    // NEW: Profile IDs for quick access
    customerId?: string
    serviceProviderId?: string
  }
  status: UserStatus
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  jti?: string
}
```

#### 2.2 Authentication Tasks

- [ ] **Update TokenPayload interface** with roles array
- [ ] **Implement role switching** in token generation
- [ ] **Create permission aggregation** logic
- [ ] **Update token verification** to handle multiple roles
- [ ] **Add profile ID lookup** utilities
- [ ] **Create role context switching** API endpoints
- [ ] **Update refresh token logic** for role changes

#### 2.3 Middleware Updates

**File**: `packages/http/src/infrastructure/fastify/middleware/auth.ts`

**Required Changes:**

```typescript
// BEFORE (problematic)
export function requireServiceProvider(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user.role !== UserRole.SERVICE_PROVIDER) {
      throw new NotAuthorizedError('Service provider access required')
    }
  }
}

// AFTER (dual role support)
export function requireServiceProvider(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user.roles.includes(UserRole.SERVICE_PROVIDER)) {
      throw new NotAuthorizedError('Service provider access required')
    }
    // Set active role context if not already set
    if (request.user.activeRole !== UserRole.SERVICE_PROVIDER) {
      request.user.activeRole = UserRole.SERVICE_PROVIDER
    }
  }
}

// NEW: Flexible role checking
export function requireAnyRole(...roles: UserRole[]): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const hasRequiredRole = roles.some((role) => request.user.roles.includes(role))
    if (!hasRequiredRole) {
      throw new NotAuthorizedError(`Access requires one of: ${roles.join(', ')}`)
    }
  }
}

// NEW: Role switching middleware
export function setActiveRole(role: UserRole): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user.roles.includes(role)) {
      throw new NotAuthorizedError(`User does not have ${role} role`)
    }
    request.user.activeRole = role
  }
}
```

#### 2.4 Authentication Middleware Tasks

- [ ] **Update role guard functions** for array-based roles
- [ ] **Create flexible role checking** utilities
- [ ] **Implement role switching** middleware
- [ ] **Update permission mapping** for multiple roles
- [ ] **Add profile context injection** headers
- [ ] **Update RBAC permission aggregation**
- [ ] **Test all authentication scenarios**

### Phase 3: Business Logic Refactoring (Week 3-5)

#### 3.1 User Context Helper Updates

**File**: `packages/http/src/infrastructure/fastify/context/RequestContext.ts`

**Current Problems:**

```typescript
// PROBLEMATIC: Assumes direct userId = profileId mapping
static getCustomerId(context: UserContext): string {
  if (!this.isCustomer(context)) {
    throw new Error('User is not a customer')
  }
  return context.userId // WRONG: userId ≠ customerId
}
```

**Required Solution:**

```typescript
// NEW: Profile ID lookup with role validation
static async getCustomerId(context: UserContext, userService: UserService): Promise<string> {
  if (!this.hasRole(context, UserRole.CUSTOMER)) {
    throw new Error('User does not have customer role')
  }

  const customerProfile = await userService.getCustomerProfile(context.userId)
  if (!customerProfile) {
    throw new Error('Customer profile not found')
  }

  return customerProfile.id
}

static async getServiceProviderId(context: UserContext, userService: UserService): Promise<string> {
  if (!this.hasRole(context, UserRole.SERVICE_PROVIDER)) {
    throw new Error('User does not have service provider role')
  }

  const providerProfile = await userService.getServiceProviderProfile(context.userId)
  if (!providerProfile) {
    throw new Error('Service provider profile not found')
  }

  return providerProfile.id
}

// NEW: Role checking utilities
static hasRole(context: UserContext, role: UserRole): boolean {
  return context.roles.includes(role)
}

static hasAnyRole(context: UserContext, roles: UserRole[]): boolean {
  return roles.some(role => context.roles.includes(role))
}
```

#### 3.2 Service-Specific Business Logic Updates

**Voucher Management** (`packages/services/voucher/src/write/application/use_cases/commands/`)

**Current Issue:**

```typescript
// ARCHITECTURAL VIOLATION: Direct userId usage
class CreateVoucherCommandHandler {
  async execute(dto: VoucherCreateDTO, userId: string): Promise<Voucher> {
    // WRONG: Assumes userId = retailerId
    return this.voucherRepo.createVoucher(dto, userId)
  }
}
```

**Required Fix:**

```typescript
// CORRECT: Profile lookup and validation
class CreateVoucherCommandHandler {
  constructor(
    private voucherRepo: VoucherWriteRepositoryPort,
    private userService: UserService, // NEW: Add user service dependency
  ) {}

  async execute(dto: VoucherCreateDTO, context: UserContext): Promise<Voucher> {
    // 1. Validate user has retailer role
    if (!context.roles.includes(UserRole.RETAILER)) {
      throw new NotAuthorizedError('User must have retailer role')
    }

    // 2. Get retailer profile ID
    const retailerProfile = await this.userService.getRetailerProfile(context.userId)
    if (!retailerProfile || !retailerProfile.isActive) {
      throw new Error('Active retailer profile required')
    }

    // 3. Create voucher with correct retailer ID
    return this.voucherRepo.createVoucher(dto, retailerProfile.id)
  }
}
```

**Redemption Management** (`packages/services/redemption/src/write/application/use_cases/commands/`)

**Current Issues:**

```typescript
// PROBLEMATIC: Mutually exclusive role logic
if (context.role === UserRole.CUSTOMER) {
  // Customer logic
} else if (context.role === UserRole.RETAILER) {
  // Retailer logic
}
```

**Required Updates:**

```typescript
// CORRECT: Inclusive role logic with profile lookup
if (context.roles.includes(UserRole.CUSTOMER) && voucher.customerId === (await getCustomerId(context))) {
  // User is customer who claimed this voucher
  allowedActions = ['view', 'redeem']
}

if (context.roles.includes(UserRole.RETAILER)) {
  const retailerId = await getRetailerId(context)
  if (voucher.retailerId === retailerId) {
    // User is retailer who created this voucher
    allowedActions.push('update', 'deactivate', 'view_analytics')
  }
}
```

#### 3.3 Business Logic Tasks by Service

**User Service Tasks:**

- [ ] **Add profile management** use cases (create/activate/deactivate profiles)
- [ ] **Implement role switching** endpoints
- [ ] **Create profile lookup** utilities
- [ ] **Update user registration** for dual role support
- [ ] **Add role validation** in all user operations

**Voucher Management Tasks:**

- [ ] **Update voucher creation** with retailer profile lookup
- [ ] **Fix authorization logic** for voucher management
- [ ] **Add dual role voucher listing** (user's vouchers as retailer)
- [ ] **Implement cross-role voucher claiming** validation

**Redemption Service Tasks:**

- [ ] **Refactor redemption authorization** for dual roles
- [ ] **Add complex authorization scenarios** (customer redeeming voucher from own store)
- [ ] **Update redemption status management** with role context
- [ ] **Implement dual-perspective redemption views**

**Messaging Service Tasks:**

- [ ] **Update conversation creation** with role context
- [ ] **Fix message authorization** for dual role participants
- [ ] **Add role switching** within conversations
- [ ] **Handle notifications** for multiple role contexts

**Notification Service Tasks:**

- [ ] **Update notification targeting** for multiple roles
- [ ] **Add role-specific notification types**
- [ ] **Implement notification preferences** per role
- [ ] **Fix notification delivery** logic

### Phase 4: API Endpoint Updates (Week 4-5)

#### 4.1 Role Switching Endpoints

**New API Endpoints Required:**

```typescript
// User role management endpoints
POST   /api/v1/users/me/roles/switch
GET    /api/v1/users/me/roles
POST   /api/v1/users/me/profiles/customer
POST   /api/v1/users/me/profiles/service-provider
PUT    /api/v1/users/me/profiles/customer/activate
PUT    /api/v1/users/me/profiles/service-provider/activate

// Role-specific profile endpoints
GET    /api/v1/users/me/customer-profile
PUT    /api/v1/users/me/customer-profile
GET    /api/v1/users/me/service-provider-profile
PUT    /api/v1/users/me/service-provider-profile
```

#### 4.2 Existing Endpoint Updates

**Service Endpoints** (`packages/services/service/src/write/api/routes/ServiceRouter.ts`):

```typescript
// BEFORE: Restrictive role guard
fastify.post(
  '/',
  {
    preHandler: requireServiceProvider(),
    schema: { body: schemas.ServiceCreateSchema },
  },
  async (request, reply) => {
    await serviceController.create(request, reply)
  },
)

// AFTER: Flexible role validation with profile check
fastify.post(
  '/',
  {
    preHandler: [requireAnyRole(UserRole.SERVICE_PROVIDER), setActiveRole(UserRole.SERVICE_PROVIDER)],
    schema: { body: schemas.ServiceCreateSchema },
  },
  async (request, reply) => {
    await serviceController.create(request, reply)
  },
)
```

#### 4.3 API Tasks

- [ ] **Create role switching** endpoints
- [ ] **Add profile management** APIs
- [ ] **Update all role-protected routes**
- [ ] **Add dual-role endpoint documentation**
- [ ] **Update OpenAPI schemas** for dual roles
- [ ] **Implement API versioning** for backward compatibility
- [ ] **Add rate limiting** for role switching operations

### Phase 5: Frontend/Mobile Updates (Week 5-6)

#### 5.1 Flutter Mobile App Updates

**User Model Updates** (`packages/frontend/flutter-app/lib/core/models/user_model.dart`):

```dart
class User {
  final String id;
  final String email;
  final List<UserRole> roles;           // CHANGED: List instead of single role
  final UserRole activeRole;            // NEW: Currently selected role
  final Map<String, String> profileIds; // NEW: Profile ID mapping
  final List<String> permissions;       // NEW: Computed permissions

  // Role checking methods
  bool hasRole(UserRole role) => roles.contains(role);
  bool hasAnyRole(List<UserRole> checkRoles) =>
    checkRoles.any((role) => roles.contains(role));
}
```

**Authentication State Updates** (`packages/frontend/flutter-app/lib/features/auth/presentation/providers/auth_state.dart`):

```dart
class AuthState {
  final User? user;
  final List<UserRole> availableRoles;  // NEW
  final UserRole? activeRole;           // NEW
  final bool isRoleSwitching;          // NEW

  // Role switching methods
  Future<void> switchRole(UserRole newRole) async {
    // Implementation for role switching
  }
}
```

#### 5.2 React Frontend Updates

**User Context** (`packages/frontend/react-app/src/contexts/AuthContext.tsx`):

```typescript
interface AuthContextValue {
  user: User | null
  availableRoles: UserRole[] // NEW
  activeRole: UserRole | null // NEW
  switchRole: (role: UserRole) => Promise<void> // NEW
  hasRole: (role: UserRole) => boolean // NEW
  hasAnyRole: (roles: UserRole[]) => boolean // NEW
}
```

#### 5.3 UI Component Updates

**Navigation Components:**

- [ ] **Add role switcher** in main navigation
- [ ] **Update dashboard layout** for multiple role contexts
- [ ] **Create role-specific menu items**
- [ ] **Add role indicators** throughout UI

**Profile Management:**

- [ ] **Create dual profile management** screens
- [ ] **Add profile activation/deactivation** toggles
- [ ] **Implement profile setup wizards**
- [ ] **Add role-specific onboarding flows**

**Business Logic Components:**

- [ ] **Update voucher listing** with role context
- [ ] **Fix redemption flows** for dual roles
- [ ] **Add cross-role voucher claiming** warnings/confirmations
- [ ] **Update messaging interface** with role context

#### 5.4 Frontend Tasks

- [ ] **Update user models** for multiple roles
- [ ] **Implement role switching** UI components
- [ ] **Create dual-role navigation** patterns
- [ ] **Update state management** for role context
- [ ] **Add role-specific routing** logic
- [ ] **Implement profile management** screens
- [ ] **Test user experience** flows
- [ ] **Add accessibility** for role switching

### Phase 6: Testing Implementation (Week 6-7)

#### 6.1 Test Infrastructure Updates

**E2E Authentication Helper** (`packages/tests/src/utils/e2eAuth.ts`):

```typescript
interface TestUserData {
  email: string
  password: string
  roles: UserRole[]              // CHANGED: Array instead of single role
  activeRole: UserRole           // NEW
  profiles: {                    // NEW
    customerId?: string
    serviceProviderId?: string
  }
}

private readonly testUsers: Record<string, TestUserData> = {
  ADMIN: {
    roles: [UserRole.ADMIN],
    activeRole: UserRole.ADMIN
  },
  CUSTOMER: {
    roles: [UserRole.CUSTOMER],
    activeRole: UserRole.CUSTOMER
  },
  SERVICE_PROVIDER: {
    roles: [UserRole.SERVICE_PROVIDER],
    activeRole: UserRole.SERVICE_PROVIDER
  },
  DUAL_ROLE_USER: {              // NEW: Dual role test user
    roles: [UserRole.CUSTOMER, UserRole.SERVICE_PROVIDER],
    activeRole: UserRole.CUSTOMER
  }
}
```

#### 6.2 Test Scenarios to Implement

**Authentication Tests:**

- [ ] **Token generation** with multiple roles
- [ ] **Role switching** functionality
- [ ] **Permission validation** for dual roles
- [ ] **JWT token verification** with role arrays

**Business Logic Tests:**

- [ ] **Voucher creation** by dual-role users
- [ ] **Redemption authorization** with complex role scenarios
- [ ] **Cross-role operations** (customer redeeming voucher from own store)
- [ ] **Profile management** operations

**API Endpoint Tests:**

- [ ] **Role-protected endpoints** with dual roles
- [ ] **Role switching** API endpoints
- [ ] **Profile management** API tests
- [ ] **Authorization boundary** testing

**Integration Tests:**

- [ ] **End-to-end dual role** user journeys
- [ ] **Database migration** testing
- [ ] **Performance testing** with role complexity
- [ ] **Security testing** for role escalation

#### 6.3 Testing Tasks

- [ ] **Update test user creation** for dual roles
- [ ] **Create dual-role test scenarios**
- [ ] **Implement authorization matrix** testing
- [ ] **Add role switching** integration tests
- [ ] **Update mock services** for dual roles
- [ ] **Create performance benchmarks**
- [ ] **Add security penetration** tests
- [ ] **Document testing procedures**

### Phase 7: Documentation and Deployment (Week 7-8)

#### 7.1 Documentation Updates

**Developer Documentation:**

- [ ] **Update API documentation** with dual role examples
- [ ] **Create migration guide** for existing installations
- [ ] **Document role switching** patterns
- [ ] **Add troubleshooting guide** for dual role issues

**User Documentation:**

- [ ] **Create user guide** for role switching
- [ ] **Document profile management** features
- [ ] **Add FAQ section** for dual role users
- [ ] **Create video tutorials** for complex workflows

#### 7.2 Deployment Preparation

**Migration Strategy:**

- [ ] **Create feature flags** for gradual rollout
- [ ] **Prepare database migration** scripts
- [ ] **Set up monitoring** for dual role operations
- [ ] **Create rollback procedures**

**Production Deployment:**

- [ ] **Deploy database changes** in maintenance window
- [ ] **Rollout backend services** with feature flags
- [ ] **Deploy frontend updates** with dual role support
- [ ] **Monitor system performance** and user adoption

## 🚨 Risk Assessment and Mitigation

### High Risk Areas

1. **Database Migration**
   - **Risk**: Data corruption during unique constraint removal
   - **Mitigation**: Extensive testing, backup procedures, rollback scripts

2. **Authentication Token Changes**
   - **Risk**: Active user sessions broken during deployment
   - **Mitigation**: Gradual token format migration, session refresh mechanisms

3. **Business Logic Complexity**
   - **Risk**: Authorization bugs with dual role scenarios
   - **Mitigation**: Comprehensive test coverage, security audits

4. **User Experience Confusion**
   - **Risk**: Users confused by role switching interface
   - **Mitigation**: User testing, progressive onboarding, clear UI indicators

### Medium Risk Areas

1. **Performance Impact**
   - **Risk**: Slower authorization with role array checking
   - **Mitigation**: Caching strategies, optimized database queries

2. **API Backward Compatibility**
   - **Risk**: Breaking changes for existing API consumers
   - **Mitigation**: API versioning, deprecation notices

3. **Cross-Role Operations**
   - **Risk**: Complex edge cases (user booking own service)
   - **Mitigation**: Clear business rules, user confirmations

## 📊 Success Metrics

### Technical Metrics

- [ ] **Zero downtime** during database migration
- [ ] **<100ms latency increase** for authorization checks
- [ ] **100% test coverage** for dual role scenarios
- [ ] **Zero security vulnerabilities** in role switching

### Business Metrics

- [ ] **>80% user adoption** of dual role features within 3 months
- [ ] **<5% support ticket increase** related to role confusion
- [ ] **Improved user engagement** metrics for dual role users
- [ ] **Increased platform revenue** from users with both roles

### User Experience Metrics

- [ ] **<3 clicks** to switch between roles
- [ ] **<5 seconds** for role switching operation
- [ ] **Clear role indicators** throughout the application
- [ ] **Intuitive profile management** interface

## 🔄 Dependencies and Prerequisites

### External Dependencies

- [ ] **Database administrator** approval for schema changes
- [ ] **Security team** review of authentication changes
- [ ] **Product team** approval of UX changes
- [ ] **QA team** resource allocation for testing

### Technical Prerequisites

- [ ] **Staging environment** setup for migration testing
- [ ] **Feature flag system** implementation
- [ ] **Monitoring and alerting** system updates
- [ ] **Backup and recovery** procedures verification

## 📅 Timeline and Milestones

### Week 1-2: Foundation (Database + Auth)

- [ ] **Milestone 1**: Database schema migration completed
- [ ] **Milestone 2**: JWT token structure updated
- [ ] **Milestone 3**: Basic authentication middleware updated

### Week 3-4: Business Logic

- [ ] **Milestone 4**: Core business logic refactored
- [ ] **Milestone 5**: API endpoints updated
- [ ] **Milestone 6**: User service dual role support

### Week 5-6: Frontend Implementation

- [ ] **Milestone 7**: Mobile app dual role support
- [ ] **Milestone 8**: React frontend updates
- [ ] **Milestone 9**: User interface testing completed

### Week 7-8: Testing and Deployment

- [ ] **Milestone 10**: Comprehensive testing completed
- [ ] **Milestone 11**: Documentation finalized
- [ ] **Milestone 12**: Production deployment successful

## 🚀 Next Steps

### Immediate Actions (This Week)

1. **Get stakeholder approval** for this implementation plan
2. **Set up project tracking** with detailed task breakdown
3. **Allocate development resources** across teams
4. **Schedule database migration** window

### Short-term Actions (Next 2 Weeks)

1. **Begin database schema design** and migration planning
2. **Start authentication system analysis** and design
3. **Create development branch** for dual role implementation
4. **Set up staging environment** for testing

### Long-term Actions (Next 8 Weeks)

1. **Execute implementation plan** according to timeline
2. **Conduct regular reviews** and adjust plan as needed
3. **Prepare for production deployment**
4. **Monitor and optimize** post-deployment

---

**Document Status**: Draft  
**Next Review**: Weekly during implementation  
**Owner**: Engineering Team  
**Stakeholders**: Product, Engineering, QA, Security, DevOps
