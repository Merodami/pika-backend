# PDF Service Migration Plan

## Overview

This document outlines the migration of the PDF service from the old Pika CQRS architecture to the new simplified Express-based architecture. The goal is to preserve all sophisticated business logic while adapting to modern patterns.

## Migration Status: 🔄 IN PROGRESS

### Analysis Update (2024-01-21)

After deep analysis of pika-old, we discovered significant gaps between the original implementation and our current approach. The original system had:

- Rich domain entities with business logic
- State machine pattern for voucher book lifecycle
- Complex page and ad placement management
- CQRS pattern with separate read/write models

Our current implementation lacks these domain behaviors and needs enhancement.

---

## Architecture Comparison

### Old Architecture (CQRS + DDD)

```
pika-old/packages/services/pdf-generator/
├── src/
│   ├── read/              # Query side
│   │   ├── api/          # Fastify controllers
│   │   ├── application/   # Query handlers
│   │   ├── domain/       # Read models
│   │   └── infrastructure/# Read repositories
│   └── write/            # Command side
│       ├── api/          # Fastify controllers
│       ├── application/   # Command handlers
│       ├── domain/       # Write models (Rich Entities)
│       └── infrastructure/# Services & repositories
```

### New Architecture (Simplified)

```
packages/services/pdf/
├── src/
│   ├── controllers/       # Express controllers
│   ├── services/         # Business logic (needs domain entities)
│   ├── repositories/     # Data access
│   ├── mappers/          # Data transformation
│   ├── routes/           # Express routes
│   ├── domain/           # Domain entities (TO BE ADDED)
│   └── utils/            # Utilities
```

---

## Core Components Migration

### 1. Domain Entity Implementation 🔴 MISSING

**VoucherBook Domain Entity Methods Needed:**

```typescript
// State Checking
isDraft(): boolean
isReadyForPrint(): boolean
isPublished(): boolean
isArchived(): boolean
canBeEdited(): boolean
hasPDF(): boolean

// State Transitions
markAsReadyForPrint(): void
publish(pdfUrl: string): void
archive(): void
update(updates: Partial<VoucherBookProps>): void

// Display Helpers
getDisplayName(): string
getDisplayPeriod(): string

// Validations
validateStateTransition(from: Status, to: Status): void
validateYear(year: number): void
validateMonth(month: number | null): void
```

**State Machine Rules:**

```
DRAFT → READY_FOR_PRINT → PUBLISHED → ARCHIVED
```

### 2. Business Logic Gaps 🔴 CRITICAL

**Missing from Current Implementation:**

1. **Domain-Driven Design Pattern**
   - No domain entities, only anemic models
   - Business logic scattered in services
   - No encapsulation of business rules

2. **State Management**
   - No state machine implementation
   - Missing transition validations
   - No business rule enforcement

3. **Authorization Logic**
   - Creator/Provider ownership not enforced
   - Missing permission checks for operations

4. **Page Management System**
   - No VoucherBookPage management
   - Missing ad placement logic
   - No space occupation tracking

### 3. Service Layer Adaptation 🟡 PARTIAL

**Current Services Status:**

#### VoucherBookService

- ✅ Basic CRUD operations
- ❌ Missing domain logic
- ❌ No state transitions
- ❌ No business validations

#### AdPlacementService

- ✅ Placement validation
- ✅ PageLayoutEngine integration
- ❌ Not integrated with VoucherBook pages
- ❌ Missing page-level constraints

#### BookDistributionService

- ✅ Complete implementation
- ✅ Status tracking
- ✅ Analytics ready

### 4. Field Mapping Discrepancies 🟡 MINOR

**Database Schema Differences:**

| pika-old Field | Current Field  | Status     | Notes                   |
| -------------- | -------------- | ---------- | ----------------------- |
| providerId     | -              | ❌ Missing | Needed for multi-tenant |
| generatedAt    | pdfGeneratedAt | ✅ Mapped  | Different name          |
| -              | deletedAt      | ✅ Added   | Soft delete support     |
| -              | updatedBy      | ✅ Added   | Better audit trail      |

---

## Implementation Roadmap

### Phase 1: Domain Entity Implementation 🚧

**Files to Read Before Implementation:**

1. `/pika-old/.../write/domain/entities/VoucherBook.ts` - Full domain logic
2. `/pika-old/.../write/domain/value-objects/` - Value object patterns
3. `/pika-old/.../write/application/commands/` - Business rule implementations

**Tasks:**

1. Create `/src/domain/entities/VoucherBook.ts` with all business methods
2. Implement state machine pattern for transitions
3. Add validation rules and business constraints
4. Create factory methods for entity creation

### Phase 2: Service Enhancement 🚧

**Files to Read Before Implementation:**

1. `/pika-old/.../CreateVoucherBookCommandHandler.ts` - Creation logic
2. `/pika-old/.../UpdateVoucherBookStatusCommandHandler.ts` - State transitions
3. `/pika-old/.../PublishVoucherBookCommandHandler.ts` - Publishing logic

**Tasks:**

1. Refactor VoucherBookService to use domain entities
2. Implement proper state transitions through domain methods
3. Add authorization checks (creator/provider/admin)
4. Integrate with PDF generation workflow

### Phase 3: Page Management System 🚧

**Files to Read Before Implementation:**

1. `/pika-old/.../write/domain/entities/VoucherBookPage.ts`
2. `/pika-old/.../write/application/commands/placements/`
3. `/pika-old/.../infrastructure/services/PageLayoutEngine.ts`

**Tasks:**

1. Implement VoucherBookPage domain entity
2. Create page management methods in VoucherBook
3. Integrate AdPlacementService with pages
4. Add space occupation tracking

### Phase 4: PDF Generation Integration 🚧

**Files to Read Before Implementation:**

1. `/pika-old/.../GeneratePDFCommandHandler.ts` - Generation orchestration
2. `/pika-old/.../infrastructure/services/PDFGenerationService.ts`
3. `/pika-old/.../infrastructure/services/QRCodeService.ts`

**Tasks:**

1. Integrate PDF generation with state machine
2. Implement rate limiting for generation
3. Add batch voucher data fetching
4. Handle QR code and short code generation

---

## Migration Strategy

### Approach: Gradual Enhancement

1. **Keep Current Working Code**
   - Don't break existing functionality
   - Add domain layer on top of current implementation

2. **Incremental Refactoring**
   - Start with domain entities
   - Gradually move business logic from services to entities
   - Maintain backward compatibility

3. **Test-Driven Migration**
   - Write tests for domain behaviors first
   - Use pika-old tests as reference
   - Ensure no regression

### Code Adaptation Pattern

When migrating each component:

```typescript
// 1. Read original implementation
// pika-old/.../write/domain/entities/VoucherBook.ts

// 2. Extract business logic, adapt to new patterns
export class VoucherBook {
  // Keep domain logic intact
  // Adapt repository calls to new structure
  // Use dependency injection for services
}

// 3. Update service to use domain entity
export class VoucherBookService {
  async updateStatus(id: string, newStatus: VoucherBookStatus) {
    const book = await this.repository.findById(id)
    const domainBook = VoucherBook.fromPersistence(book)

    // Use domain method for business logic
    domainBook.transitionTo(newStatus)

    await this.repository.update(id, domainBook.toPersistence())
  }
}
```

---

## Critical Business Rules to Preserve

1. **State Transitions**
   - Only DRAFT → READY_FOR_PRINT → PUBLISHED → ARCHIVED
   - Cannot skip states
   - Cannot go backward (except READY_FOR_PRINT → DRAFT)

2. **Edit Permissions**
   - Only DRAFT books can be edited
   - Only creator, provider, or admin can modify
   - Published books are immutable

3. **PDF Requirements**
   - Must have PDF URL to publish
   - PDF generation triggers READY_FOR_PRINT state
   - Rate limit PDF generation per user

4. **Page Constraints**
   - Cannot exceed totalPages
   - Pages must be sequential
   - Cannot modify pages in non-DRAFT books

5. **Validation Rules**
   - Year: 2020-2100
   - Month: 1-12 or null
   - Title: Required, max 255 chars
   - Edition: Optional, max 100 chars

---

## Type Safety Considerations

### Domain to Persistence Mapping

```typescript
// Domain Entity (rich behavior)
class VoucherBook {
  private constructor(private props: VoucherBookProps) {}

  // Business methods...

  toPersistence(): VoucherBookPersistence {
    return {
      ...this.props,
      status: this.props.status.toString(),
    }
  }

  static fromPersistence(data: VoucherBookPersistence): VoucherBook {
    return new VoucherBook({
      ...data,
      status: VoucherBookStatus[data.status],
    })
  }
}

// Persistence Model (Prisma)
interface VoucherBookPersistence {
  id: string
  status: string // lowercase in DB
  // ... other fields
}
```

---

## Testing Strategy

### Domain Testing Priority

1. **State Machine Tests**

   ```typescript
   describe('VoucherBook State Transitions', () => {
     test('should transition from DRAFT to READY_FOR_PRINT')
     test('should not allow skipping states')
     test('should enforce transition rules')
   })
   ```

2. **Business Rule Tests**

   ```typescript
   describe('VoucherBook Business Rules', () => {
     test('should only allow edits in DRAFT state')
     test('should require PDF URL for publishing')
     test('should validate year and month constraints')
   })
   ```

3. **Integration Tests**
   - Copy and adapt from pika-old
   - Test full workflows end-to-end
   - Verify state persistence

---

## Success Metrics

- ✅ Core infrastructure migrated
- 🔄 Domain entities implementation (IN PROGRESS)
- ❌ Business logic encapsulation
- ❌ State machine implementation
- ❌ Authorization logic
- ❌ Page management system
- ✅ Database schema aligned
- ✅ API contracts defined
- 🔄 Test coverage (PARTIAL)

---

## Risk Mitigation

1. **Complexity Risk**
   - Consider if full page/placement system is needed
   - Could simplify to just voucher books without complex layouts

2. **State Machine Risk**
   - Well-understood pattern
   - Clear transition rules
   - Easy to test

3. **Performance Risk**
   - Keep batch operations
   - Maintain caching strategy
   - Profile PDF generation

---

## Recommendations

1. **Immediate Priority**: Implement VoucherBook domain entity with state machine
2. **Consider Simplification**: Evaluate if complex page/placement system is needed
3. **Maintain Separation**: Keep domain logic in entities, not services
4. **Test First**: Write domain tests before implementation
5. **Incremental Migration**: Don't try to migrate everything at once

---

## Next Steps

1. [ ] Review this plan with team
2. [ ] Decide on page/placement system complexity
3. [ ] Create VoucherBook domain entity
4. [ ] Implement state machine pattern
5. [ ] Add domain tests
6. [ ] Refactor services to use domain entities
7. [ ] Run full integration tests
8. [ ] Update API documentation

---

## Conclusion

The current implementation has the infrastructure in place but lacks the rich domain model that made the original system robust. By implementing domain entities with proper business logic encapsulation, we can achieve the same level of sophistication while maintaining our simpler architecture.

**Key Insight**: The architecture can be simple, but the domain logic must remain rich and properly encapsulated.
