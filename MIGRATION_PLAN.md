# Pika Backend Migration Analysis

## Overview
This document provides a comprehensive analysis and migration strategy for transitioning from the old Pika architecture (located in `/pika` folder) to the new modern microservices architecture (formerly Solo60, now renamed to Pika).

## Current Migration Status (Updated 2025-01-16)

### 🎉 MAJOR MILESTONE: Gym Feature Removal Complete ✅

### Completed Migration Tasks ✅
1. **UserRole Enum Simplification**
   - Reduced from 5 roles (ADMIN, MEMBER, PROFESSIONAL, THERAPIST, CONTENT_CREATOR) to 2 roles (ADMIN, USER)
   - Updated across all packages: types, API schemas, authentication middleware, services
   - Removed gym-related user properties (specialties, description)

2. **ProblemType Enum Cleanup**
   - Removed gym-related problem types: BOOKING, GYM_ISSUE, TRAINER_ISSUE
   - Updated to focus on core platform issues: BILLING, TECHNICAL, ACCOUNT, GENERAL, BUG_REPORT, FEATURE_REQUEST

3. **API Gateway Cleanup**
   - Removed gym-related service routes (gym, session, social, booking, friends)
   - Removed health check configurations for gym services
   - Updated proxy route configurations

4. **API Schema Updates**
   - Updated common enums to remove gym-related types
   - Fixed payment service schemas (removed BOOKING payment type)
   - Updated communication service schemas (removed BOOKING notifications)
   - Updated subscription service schemas (removed SESSION_BOOKING usage)
   - Updated admin user management schemas

5. **Service Import Corrections**
   - Fixed corrupted import statements across multiple services
   - Communication service: ✅ Building successfully
   - Support service: ✅ Building successfully
   - Auth service: ✅ Building successfully
   - API Gateway: ✅ Building successfully
   - Storage service: ✅ Building successfully
   - Payment service: ✅ Fixed imports and role checks

6. **Payment Service Simplification** ✅
   - Removed credits system and related database dependencies
   - Removed promo code management system
   - Removed membership management features
   - Simplified to core Stripe product management and webhook handling
   - **Status: ✅ Building successfully**

7. **Subscription Service Database References** ✅
   - Removed CreditProcessingService dependencies
   - Fixed all database references to non-existent tables (credits, creditsHistory)
   - Fixed enum comparison issues (UserRole and SubscriptionStatus)
   - Removed membershipType and gym-related properties
   - Fixed planType references throughout the service
   - Updated UserMembershipService to remove credits and membership features
   - **Status: ✅ Building successfully**

8. **User Service Cleanup** ✅
   - Fixed references to removed properties (friends, professional, guests, alias)
   - Removed includes for non-existent database relations
   - Updated admin controller to handle removed features
   - **Status: ✅ Building successfully**

9. **Deployment Service Updates** ✅
   - Fixed references to removed GymServiceClient
   - Updated tsconfig.json to remove non-existent services
   - Updated ServiceClients interface
   - **Status: ✅ Building successfully**

10. **Empty Service Cleanup** ✅
    - Added placeholder for category service to enable builds
    - **Status: ✅ Building successfully**

### Current Status: ALL SERVICES BUILDING SUCCESSFULLY ✅

**All 20 packages in the monorepo now compile cleanly with no TypeScript errors.**

### Next Phase Recommendations 🚀

With all services now building successfully, the following areas are ready for improvement:

#### 1. **Database Schema Cleanup** 🗄️
- **Priority**: High
- **Effort**: 1-2 weeks
- **Tasks**:
  - [ ] Remove unused database tables (credits, creditsHistory, membership, gym-related tables)
  - [ ] Clean up Prisma schema files to match simplified architecture
  - [ ] Create database migration scripts to drop unused tables
  - [ ] Update seed scripts to remove gym-related data
  - [ ] Verify all foreign key constraints are properly handled

#### 2. **API Documentation & SDK Update** 📚
- **Priority**: High
- **Effort**: 3-5 days
- **Tasks**:
  - [ ] Update OpenAPI specifications to reflect removed endpoints
  - [ ] Remove gym-related API schemas from all three tiers (public, admin, internal)
  - [ ] Regenerate SDK to remove old types and methods
  - [ ] Update API documentation examples
  - [ ] Test SDK generation pipeline with cleaned schemas

#### 3. **Test Suite Cleanup** 🧪
- **Priority**: Medium
- **Effort**: 1 week
- **Tasks**:
  - [ ] Remove or update tests that reference removed gym features
  - [ ] Fix integration tests that expect credit/membership functionality
  - [ ] Update test data factories to match simplified schemas
  - [ ] Verify all service integration tests pass
  - [ ] Update test setup utilities to remove gym-related configurations

#### 4. **Code Quality Improvements** 🔧
- **Priority**: Medium
- **Effort**: 3-5 days
- **Tasks**:
  - [ ] Remove `as any` type assertions added during migration
  - [ ] Create proper types for SubscriptionStatus and UserRole enums
  - [ ] Clean up unused imports and dependencies
  - [ ] Standardize error handling across services
  - [ ] Add proper TypeScript strict mode compliance

#### 5. **Environment & Configuration Cleanup** ⚙️
- **Priority**: Low
- **Effort**: 1-2 days
- **Tasks**:
  - [ ] Clean up environment variables for removed services
  - [ ] Update deployment configurations (Vercel, Docker)
  - [ ] Remove unused service references from configuration files
  - [ ] Update health check configurations
  - [ ] Clean up package.json scripts

#### 6. **Documentation Updates** 📖
- **Priority**: Low
- **Effort**: 2-3 days
- **Tasks**:
  - [ ] Update CLAUDE.md to reflect current simplified architecture
  - [ ] Update README files to match current service structure
  - [ ] Document new simplified service boundaries
  - [ ] Update architecture diagrams
  - [ ] Create migration guide for future reference

#### 7. **Performance Optimization** ⚡
- **Priority**: Future
- **Effort**: 1-2 weeks
- **Tasks**:
  - [ ] Optimize database queries with removed joins
  - [ ] Review caching strategies for simplified data model
  - [ ] Benchmark performance improvements from removed complexity
  - [ ] Optimize service communication patterns
  - [ ] Review and optimize bundle sizes

### Immediate Next Steps (Recommended Priority)

1. **Database Schema Cleanup** - Most impactful for data integrity
2. **API Documentation Update** - Essential for frontend development
3. **Test Suite Cleanup** - Required for reliable CI/CD
4. **Code Quality Improvements** - Important for maintainability

### Architectural Impact
The migration has successfully removed gym-specific functionality while maintaining the core platform architecture. The new simplified user role system and problem categorization align with a more general-purpose platform approach.

### Technical Debt Identified
- **Import Corruption**: Widespread search-and-replace issue affected multiple services
- **Database Schema Dependencies**: Some services have gym-specific fields that need schema migration
- **Service Interdependencies**: Some services rely on gym-specific functionality that needs redesign

## Table of Contents
1. [Deep Architecture Analysis](#deep-architecture-analysis)
2. [Technology Stack Comparison](#technology-stack-comparison)
3. [Service-by-Service Breakdown](#service-by-service-breakdown)
4. [Migration Strategy](#migration-strategy)
5. [Technical Decisions](#technical-decisions)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Risk Assessment](#risk-assessment)

## Deep Architecture Analysis

### Old Pika Architecture (`/pika`)

#### Architectural Patterns
1. **CQRS (Command Query Responsibility Segregation)**
   - Separate read/write models in voucher service
   - Command handlers for business operations
   - Query handlers for data retrieval
   - Event-driven state changes

2. **Domain-Driven Design (DDD)**
   - Rich domain entities with business logic
   - Value objects for immutable data
   - Aggregates maintaining consistency
   - Domain events for state transitions

3. **Hexagonal Architecture**
   - Ports and adapters pattern
   - Clear separation between domain and infrastructure
   - Dependency inversion throughout

#### Service Implementation Details

**Voucher Service (Most Complex)**:
```
/voucher/
├── read/
│   ├── api/controllers/          # HTTP handlers
│   ├── application/use_cases/    # Query handlers
│   ├── domain/                   # Read models
│   └── infrastructure/           # Data access
└── write/
    ├── api/controllers/          # Command endpoints
    ├── application/use_cases/    # Command handlers
    ├── domain/                   # Aggregates, events
    └── infrastructure/           # Persistence, messaging
```

**Key Use Cases Identified**:
- CreateVoucherCommandHandler
- ClaimVoucherCommandHandler
- RedeemVoucherCommandHandler
- ExpireVoucherCommandHandler
- VoucherScanCommandHandler
- UpdateVoucherStateCommandHandler

**Provider Service**:
- File upload handling with multer
- Image processing capabilities
- Category associations
- Availability management
- Verification workflow

**Communication Stack**:
- Messaging: Real-time chat between customers/providers
- Notification: Push notifications via Firebase FCM
- Communication: Attempted consolidation (incomplete)

#### Database Schema Analysis

**Key Tables**:
- users (with roles: customer, provider, admin)
- providers (business profiles)
- vouchers (multilingual content, spatial data)
- voucher_redemptions
- categories (hierarchical, multilingual)
- campaigns
- reviews
- addresses (PostGIS geography)
- fraud_detection_logs

**Notable Features**:
- JSONB for multilingual content
- Geography types for location queries
- Soft deletes throughout
- Audit trails on all tables
- Optimistic locking (version fields)

#### Authentication & Security
- **Firebase Auth**: Primary authentication
- **JWT Tokens**: Platform tokens with RS256
- **Token Exchange**: Firebase → Platform JWT
- **Role-Based Access**: customer, provider, admin
- **API Key Auth**: Service-to-service communication
- **Rate Limiting**: Per-endpoint configuration

#### External Integrations
- **Firebase**: Auth, FCM, Realtime Database
- **AWS**: S3 (planned), SES (email)
- **Elasticsearch**: Search functionality
- **PostGIS**: Spatial queries
- **PDF Generation**: Voucher books

### New Architecture (Current Codebase)

#### Architectural Patterns
1. **Clean Architecture**
   - Controller → Service → Repository
   - Clear dependency rules
   - Framework independence
   - Testable by design

2. **API-First Development**
   - OpenAPI specification driven
   - Contract-first approach
   - Automated SDK generation
   - Type safety end-to-end

3. **Microservices with Monolith Option**
   - Can run as separate services
   - Can embed all services (Vercel deployment)
   - Shared infrastructure components

#### Service Implementation Pattern

**Standard Service Structure**:
```
/service-name/
├── controllers/         # HTTP request handlers
├── services/           # Business logic
├── repositories/       # Data access
├── routes/            # Route definitions
├── middleware/        # Service-specific middleware
├── types/             # TypeScript types
└── utils/             # Helper functions
```

**Controller Pattern**:
```typescript
export class ServiceController {
  constructor(private readonly service: IService) {
    // Bind methods for 'this' context
    this.getAll = this.getAll.bind(this)
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.getAll(params)
      const dto = ResultMapper.toDTO(result)
      res.json(dto)
    } catch (error) {
      next(error)
    }
  }
}
```

#### API Structure Deep Dive

**Three-Tier API Design**:

1. **Public API** (`/api/public/`)
   - Customer-facing endpoints
   - No authentication required for browsing
   - Authentication required for actions
   - Rate limited

2. **Admin API** (`/api/admin/`)
   - Dashboard operations
   - Requires admin role
   - Full CRUD operations
   - Analytics endpoints

3. **Internal API** (`/api/internal/`)
   - Service-to-service only
   - API key authentication
   - No rate limiting
   - Bulk operations

#### Service Communication Pattern

**BaseServiceClient Implementation**:
```typescript
export class BaseServiceClient {
  // Retry logic with exponential backoff
  // Automatic error transformation
  // Context propagation (correlation IDs)
  // Circuit breaker pattern (planned)
}
```

**Service Clients**:
- UserServiceClient
- PaymentServiceClient
- CommunicationServiceClient
- SubscriptionServiceClient
- GymServiceClient
- SessionServiceClient

#### Validation & Type Safety

**Zod Schema Pattern**:
```typescript
// Schema definition
export const CreateVoucherRequest = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  value: z.number().positive(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
})

// Type inference
export type CreateVoucherRequest = z.infer<typeof CreateVoucherRequest>

// Validation middleware
router.post('/', validateBody(CreateVoucherRequest), controller.create)
```

#### Caching Strategy

**Two-Tier Caching**:
1. **Redis Cache Service**
   - Centralized caching
   - TTL management
   - Cache invalidation

2. **Method Decorators**
   ```typescript
   @Cache({ ttl: 3600, prefix: 'vouchers' })
   async getVouchers() { }
   ```

#### SDK Generation Pipeline

1. **Step 1: API Generation**
   - Read Zod schemas
   - Generate OpenAPI spec
   - Create documentation

2. **Step 2: SDK Generation**
   - Parse OpenAPI spec
   - Generate TypeScript client
   - Create type definitions
   - Publish npm package

#### Deployment Architecture

**Vercel Deployment (Production)**:
- Single function deployment
- All services embedded
- Shared database connections
- Optimized for cold starts

**Local Development**:
- Services run independently
- Docker compose for infrastructure
- Hot reload with tsx
- Service discovery via env vars

## Technology Stack Comparison

| Component | Old Pika | New Architecture | Decision |
|-----------|----------|------------------|----------|
| **Runtime** | Node.js 22.x | Node.js 22.x | ✅ Keep |
| **Language** | TypeScript 5.8 | TypeScript 5.8 | ✅ Keep |
| **HTTP Framework** | Fastify 5.x | Express 4.x | ⚠️ Evaluate |
| **Validation** | TypeBox | Zod | ✅ Use Zod |
| **Database** | PostgreSQL 16 | PostgreSQL 16 | ✅ Keep |
| **ORM** | Prisma 6.9 | Prisma 6.9 | ✅ Keep |
| **Cache** | Redis 7.x | Redis 7.x | ✅ Keep |
| **Auth** | Firebase + JWT | JWT | ⚠️ Merge approach |
| **Real-time** | Firebase | - | 📝 Add later |
| **File Storage** | Local + S3 | S3 + MinIO | ✅ Use new |
| **Email** | Multiple providers | AWS SES + Resend | ✅ Use new |
| **API Docs** | OpenAPI | OpenAPI | ✅ Keep |
| **Testing** | Vitest | Vitest | ✅ Keep |
| **Build** | NX + Yarn | NX + Yarn | ✅ Keep |

## Service-by-Service Breakdown

### Services to Migrate from Old

1. **Voucher Service**
   - **Complexity**: High (CQRS pattern)
   - **Dependencies**: Provider, Category, User
   - **Features**: Create, claim, redeem, expire, QR scanning
   - **Migration Effort**: 2-3 weeks

2. **Provider Service**
   - **Complexity**: Medium
   - **Dependencies**: Category, User, File storage
   - **Features**: Registration, verification, availability
   - **Migration Effort**: 1-2 weeks

3. **Category Service**
   - **Complexity**: Low
   - **Dependencies**: None
   - **Features**: Hierarchical categories, multilingual
   - **Migration Effort**: 3-5 days

4. **Campaign Service**
   - **Complexity**: Medium
   - **Dependencies**: Voucher, Provider
   - **Features**: Campaign rules, targeting
   - **Migration Effort**: 1 week

5. **Review Service**
   - **Complexity**: Low
   - **Dependencies**: Provider, User
   - **Features**: Ratings, comments
   - **Migration Effort**: 3-5 days

6. **PDF Generator Service**
   - **Complexity**: Medium
   - **Dependencies**: Voucher
   - **Features**: Voucher books, QR codes
   - **Migration Effort**: 1 week

### Services to Keep from New

1. **Auth Service** ✅
   - Already implements JWT
   - Good separation of concerns
   - Add Firebase integration

2. **User Service** ✅
   - Clean implementation
   - Proper admin/public separation
   - Ready for extension

3. **Communication Service** ✅
   - Well-consolidated
   - Multiple provider support
   - Template system

4. **Storage Service** ✅
   - Provider pattern
   - S3 + MinIO support
   - Presigned URLs

5. **Payment Service** ✅
   - Stripe integration complete
   - Webhook handling
   - Credit system

6. **Subscription Service** ✅
   - Plan management
   - Credit processing
   - User memberships

### Services to Remove

1. **Gym Service** ❌ - Domain specific
2. **Session Service** ❌ - Domain specific
3. **Social Service** ❌ - Domain specific

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
1. **Clean up codebase**
   - Remove gym, session, social services
   - Update all @solo60 references to @pika
   - Fix build configuration
   - Update environment variables

2. **Database migration**
   - Create migration scripts
   - Map old schema to new
   - Preserve multilingual fields
   - Add missing tables

3. **Update shared packages**
   - Add missing types
   - Update error codes
   - Add utility functions

### Phase 2: Core Services (Week 3-5)

#### Voucher Service Migration
1. **Simplify Architecture**
   - Convert CQRS to Clean Architecture
   - Merge read/write into single flow
   - Keep domain logic

2. **Create Structure**
   ```
   /services/voucher/
   ├── controllers/
   │   ├── VoucherController.ts      # Public endpoints
   │   ├── AdminVoucherController.ts # Admin operations
   │   └── RedemptionController.ts   # Redemption flow
   ├── services/
   │   ├── VoucherService.ts
   │   ├── RedemptionService.ts
   │   ├── QRCodeService.ts
   │   └── ValidationService.ts
   ├── repositories/
   │   ├── VoucherRepository.ts
   │   └── RedemptionRepository.ts
   └── mappers/
       ├── VoucherMapper.ts
       └── RedemptionMapper.ts
   ```

3. **API Endpoints**
   - Public: GET /vouchers, GET /vouchers/:id, POST /vouchers/:id/claim
   - Admin: Full CRUD + analytics
   - Internal: Validation, stock checks

#### Provider Service Migration
1. **Merge with Reviews**
   - Single service for provider domain
   - Shared repository

2. **Structure**
   ```
   /services/provider/
   ├── controllers/
   │   ├── ProviderController.ts
   │   ├── AdminProviderController.ts
   │   └── ReviewController.ts
   ├── services/
   │   ├── ProviderService.ts
   │   ├── ReviewService.ts
   │   ├── VerificationService.ts
   │   └── AvailabilityService.ts
   └── repositories/
       ├── ProviderRepository.ts
       └── ReviewRepository.ts
   ```

### Phase 3: Supporting Services (Week 6-7)

1. **Category Service**
   - Simple CRUD with hierarchy
   - Multilingual support
   - Caching for performance

2. **Campaign Service**
   - Campaign rules engine
   - Voucher generation
   - Analytics

3. **PDF Generator**
   - Evaluate if needed
   - Could be part of voucher service
   - Or separate utility service

### Phase 4: Integration (Week 8-9)

1. **Firebase Integration**
   - Add to auth service
   - Real-time features
   - Push notifications

2. **Search Integration**
   - Elasticsearch or PostgreSQL FTS
   - Provider search
   - Voucher discovery

3. **Analytics**
   - Usage tracking
   - Business insights
   - Performance metrics

### Phase 5: Testing & Documentation (Week 10)

1. **Integration Tests**
   - Full flow testing
   - Service interaction tests
   - Performance tests

2. **API Documentation**
   - Update OpenAPI specs
   - Generate SDK
   - API examples

3. **Deployment**
   - Update Vercel config
   - Environment setup
   - Monitoring

## Technical Decisions

### Architecture Decisions

1. **Use Clean Architecture**
   - Simpler than CQRS
   - Easier to maintain
   - Better for team onboarding

2. **Keep Service Separation**
   - Microservices architecture
   - Can deploy together (Vercel)
   - Future flexibility

3. **API-First Development**
   - Design APIs first
   - Generate types from OpenAPI
   - Contract testing

### Technology Decisions

1. **Validation: Zod**
   - Better TypeScript integration
   - Runtime type safety
   - Schema inference

2. **HTTP Framework: Express**
   - Mature ecosystem
   - Team familiarity
   - Vercel compatibility

3. **Authentication: Hybrid**
   - JWT for platform
   - Firebase for mobile
   - Token exchange

### Data Decisions

1. **Keep PostgreSQL**
   - Proven scalability
   - PostGIS for location
   - JSONB for flexibility

2. **Redis Caching**
   - Performance optimization
   - Session management
   - Rate limiting

3. **Denormalization**
   - Performance over purity
   - Cache computed fields
   - Reduce joins

## Implementation Roadmap

### Week 1-2: Foundation
- [ ] Remove domain-specific services
- [ ] Fix build issues from renaming
- [ ] Database schema migration
- [ ] Environment setup

### Week 3-4: Voucher Service
- [ ] Create service structure
- [ ] Migrate business logic
- [ ] Implement controllers
- [ ] Add validation

### Week 5: Provider Service
- [ ] Merge with reviews
- [ ] Implement verification
- [ ] Add availability

### Week 6: Category & Campaign
- [ ] Category hierarchy
- [ ] Campaign rules
- [ ] Voucher generation

### Week 7: Integration
- [ ] Firebase auth
- [ ] Service communication
- [ ] End-to-end flows

### Week 8: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests

### Week 9: Documentation
- [ ] API documentation
- [ ] SDK generation
- [ ] Deployment guide

### Week 10: Deployment
- [ ] Vercel configuration
- [ ] Production setup
- [ ] Monitoring

## Risk Assessment

### High Risk
1. **Data Migration**
   - Complex schema changes
   - Multilingual content
   - Mitigation: Thorough testing, rollback plan

2. **Service Dependencies**
   - Circular dependencies
   - Version conflicts
   - Mitigation: Clear boundaries, dependency injection

### Medium Risk
1. **Performance**
   - CQRS to Clean Architecture
   - N+1 queries
   - Mitigation: Caching, monitoring

2. **Firebase Integration**
   - Token exchange complexity
   - Real-time features
   - Mitigation: Phased approach

### Low Risk
1. **Team Learning**
   - New patterns
   - Different structure
   - Mitigation: Documentation, pairing

## Service Consolidation Decision Matrix

| Old Services | New Service | Rationale |
|-------------|-------------|-----------|
| Voucher + Redemption | Voucher | Same bounded context |
| Provider + Review | Provider | Reviews belong to providers |
| Messaging + Notification | Communication | Already consolidated in new |
| Category | Category | Keep separate (cross-cutting) |
| Campaign | Campaign | Distinct business logic |
| PDF Generator | Utility or embed | Evaluate usage |

## Migration Checklist

### Per-Service Checklist
- [ ] Analyze old service implementation
- [ ] Design new service structure
- [ ] Create database migrations
- [ ] Implement repositories
- [ ] Implement services
- [ ] Implement controllers
- [ ] Create mappers
- [ ] Add validation schemas
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Generate SDK types
- [ ] Deploy and test

### Global Checklist
- [ ] Update CLAUDE.md
- [ ] Fix package references
- [ ] Update environment variables
- [ ] Configure build system
- [ ] Setup CI/CD
- [ ] Create deployment scripts
- [ ] Setup monitoring
- [ ] Create runbooks

## Success Criteria

1. **All core business logic migrated**
2. **Build and tests passing**
3. **API documentation complete**
4. **SDK generated and typed**
5. **Deployed to Vercel**
6. **Performance benchmarks met**
7. **Zero data loss**

## Open Questions Resolved

1. **PDF Generation**: Keep as utility service if usage justifies
2. **Fraud Detection**: Part of payment service
3. **Data Migration**: Blue-green deployment with sync
4. **Firebase Timeline**: Phase 4, after core migration

---
*Last Updated: [Current Date]*
*Status: Ready for Implementation*