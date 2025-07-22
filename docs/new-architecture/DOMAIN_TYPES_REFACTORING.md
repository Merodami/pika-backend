# Domain Types Refactoring Strategy

## Executive Summary

Services currently share domain objects through `@pika/sdk`, creating tight coupling. Each service should own its domain types while sharing only DTOs for communication.

## The Problem

```
Current Architecture:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   @pika/sdk/domain/VoucherDomain
          ↓            ↓            ↓
   Voucher Service  PDF Service  Booking Service
   (needs everything) (needs 20%)  (needs 10%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues:
- All services must use the same VoucherDomain structure
- Adding a field for one service affects all services
- Creates deployment dependencies
- Violates microservices principles
```

## The Solution

```
Target Architecture:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voucher Service     PDF Service       Booking Service
    Voucher         VoucherBook       VoucherReference
 (full entity)    (what PDF needs)   (just id & title)
      ↓                  ↓                   ↓
          Communicate via shared DTOs
              (@pika/contracts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Core Principles

### 1. Service Owns Its Domain
Each service defines entities based on its needs:

```typescript
// Voucher Service (needs everything)
interface Voucher {
  id: string
  title: string
  description: string
  price: number
  discount: number
  validFrom: Date
  validUntil: Date
  terms: string
  // ... 20+ more fields
}

// PDF Service (needs less)
interface VoucherReference {
  id: string
  title: string
  imageUrl?: string
  qrPayload?: string
  shortCode?: string
}

// Booking Service (needs minimal)
interface VoucherStub {
  id: string
  title: string
}
```

### 2. Share Contracts, Not Internals
Services communicate using DTOs:

```typescript
// Shared DTO for API communication
interface VoucherDTO {
  id: string
  title: string
  price: number
  // Standard fields for external communication
}
```

### 3. Transform at Boundaries
Map between internal and external representations:

```typescript
// In PDF Service
class PDFVoucherMapper {
  static fromDTO(dto: VoucherDTO): VoucherReference {
    return {
      id: dto.id,
      title: dto.title,
      // Only map what PDF needs
    }
  }
}
```

## Implementation Structure

```
packages/services/[service-name]/src/types/
├── index.ts           // Main export
├── entities.ts        // Core domain entities
├── operations.ts      // Service operations & results  
├── repositories.ts    // Repository interfaces
├── api-contracts.ts   // DTOs for external APIs
└── enums.ts          // Service-specific enums
```

## Benefits

1. **Independence**: Services evolve without affecting others
2. **Clarity**: Each service explicitly shows what it uses
3. **Team Autonomy**: Teams work without coordination
4. **True Microservices**: Proper bounded contexts
5. **Easier Testing**: Test with exactly what service needs

## Migration Path

### Phase 1: Pilot Service (PDF)
- Create types/ folder structure
- Copy only needed types from SDK
- Update imports gradually

### Phase 2: Core Services
- Voucher Service
- User Service  
- Booking Service

### Phase 3: Supporting Services
- Payment Service
- Communication Service
- Others

### Phase 4: Cleanup
- Remove domain objects from SDK
- Keep only shared DTOs
- Update documentation

## What Changes vs What Stays

### Changes
- Domain entities: `@pika/sdk` → service-specific
- Mappers: Shared → service-specific
- Type imports: External → internal

### Stays the Same
- Architecture pattern (Clean Architecture)
- Folder structure (controllers/services/repositories)
- Shared utilities (@pika/shared)
- Infrastructure (@pika/database, @pika/redis)
- API contracts (DTOs remain shared)

## Example: PDF Service Transformation

### Before
```typescript
// Depends on shared domain
import { VoucherBookDomain, UserDomain } from '@pika/sdk'
import { VoucherBookMapper } from '@pika/sdk'

// Service is coupled to SDK changes
```

### After
```typescript
// Own domain types
import { VoucherBook, UserReference } from './types/entities'
import { VoucherBookMapper } from './mappers/VoucherBookMapper'

// Service is independent
```

## Success Criteria

1. No domain objects in @pika/sdk
2. Each service has types/ folder
3. Services communicate via DTOs only
4. No compilation errors
5. Tests still pass

## Timeline

- Stabilization first (fix all TypeScript errors)
- Then migrate one service at a time
- Estimate: 2-3 days per service

## References

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Building Microservices - Sam Newman](https://samnewman.io/books/building_microservices/)
- [Clean Architecture - Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)