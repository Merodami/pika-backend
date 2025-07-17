# PDF Service Migration Plan

## Overview

This document outlines the migration of the PDF service from the old Pika CQRS architecture to the new simplified Express-based architecture. The goal is to preserve all sophisticated business logic while adapting to modern patterns.

## Migration Status: 🟢 NEAR COMPLETION

### Completed ✅
- [x] Schema migration with security enhancements
- [x] Repository layer with new patterns
- [x] Zod schemas following new standards
- [x] Core business logic extraction and adaptation
- [x] Integration test preservation
- [x] **Mapper implementation with business rules**
- [x] **Controller adaptation (Express) - Admin & Public**

### In Progress 🔄
- [ ] Route setup with middleware
- [ ] API documentation integration

### Pending ⏳
- [ ] Internal API controllers
- [ ] Service integration testing
- [ ] Deployment configuration

---

## Architecture Comparison

### Old Architecture (CQRS)
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
│       ├── domain/       # Write models
│       └── infrastructure/# Services & repositories
```

### New Architecture (Simplified)
```
packages/services/pdf/
├── src/
│   ├── controllers/       # Express controllers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access
│   ├── mappers/          # Data transformation
│   ├── routes/           # Express routes
│   └── utils/            # Utilities
```

---

## Core Components Migration

### 1. Database Schema ✅

**Enhancements Made:**
- Added security fields: `createdById`, `updatedById`
- Improved BookDistribution model for real-world logistics
- Proper schema organization (`@@schema("files")`)
- Comprehensive indexes for performance

**Tables Migrated:**
- `voucher_books` - Core voucher book management
- `voucher_book_pages` - Page layout tracking
- `ad_placements` - Flexible content placement
- `book_distributions` - Business distribution tracking

### 2. Business Logic Extraction ✅

**Services Successfully Extracted:**

#### PDFGenerationService
- **Status**: ✅ Copied and adapted
- **Location**: `src/services/PDFGenerationService.ts`
- **Features Preserved**:
  - A5 format (148x210mm) PDF generation
  - Multi-page voucher book creation
  - Cover and back page rendering
  - Font optimization

#### QRCodeService  
- **Status**: ✅ Copied intact
- **Location**: `src/services/QRCodeService.ts`
- **Features Preserved**:
  - Multiple format support (SVG, PNG, DataURL)
  - Configurable error correction
  - Size optimization
  - JWT payload embedding

#### PageLayoutEngine
- **Status**: ✅ Copied intact
- **Location**: `src/services/PageLayoutEngine.ts`
- **Features Preserved**:
  - 2x4 grid system (8 spaces)
  - Placement conflict detection
  - Size validation (SINGLE, QUARTER, HALF, FULL)
  - Optimal placement suggestions

#### CryptoServiceAdapter
- **Status**: ✅ Copied intact
- **Location**: `src/services/CryptoServiceAdapter.ts`
- **Features Preserved**:
  - JWT generation for QR codes
  - ECDSA signing
  - Short code generation
  - Voucher security

#### PDFRateLimiter
- **Status**: ✅ Copied intact
- **Location**: `src/services/PDFRateLimiter.ts`
- **Features Preserved**:
  - Redis-backed rate limiting
  - Hourly/daily limits
  - Per-user tracking
  - Graceful degradation

### 3. Service Layer Adaptation ✅

**New Services Created:**

#### VoucherBookService
- **Status**: ✅ Created
- **Location**: `src/services/VoucherBookService.ts`
- **Combines**:
  - CreateVoucherBookCommandHandler
  - UpdateVoucherBookCommandHandler
  - GeneratePDFCommandHandler
  - GetVoucherBookQueryHandler
- **Features**:
  - Complete lifecycle management
  - State machine (DRAFT → READY_FOR_PRINT → PUBLISHED → ARCHIVED)
  - PDF generation orchestration
  - Cache integration

#### AdPlacementService
- **Status**: ✅ Created
- **Location**: `src/services/AdPlacementService.ts`
- **Combines**:
  - CreateAdPlacementCommandHandler
  - UpdateAdPlacementCommandHandler
  - Layout validation logic
- **Features**:
  - Sophisticated placement validation
  - PageLayoutEngine integration
  - Conflict detection
  - Optimal suggestions

#### BookDistributionService
- **Status**: ✅ Created
- **Location**: `src/services/BookDistributionService.ts`
- **Features**:
  - Distribution lifecycle (PENDING → SHIPPED → DELIVERED)
  - Business analytics
  - Contact management
  - Shipping integration

### 4. Repository Layer ✅

**Repositories Implemented:**
- `VoucherBookRepository` - CRUD + pagination
- `VoucherBookPageRepository` - Page management
- `AdPlacementRepository` - Placement + reordering
- `BookDistributionRepository` - Distribution tracking + stats

**Patterns Used:**
- Standardized interfaces
- Include/relation handling
- Soft delete support
- Performance optimization

### 5. Schema Validation ✅

**Zod Schemas Created:**
- Admin schemas for management operations
- Public schemas for client access
- Internal schemas for service communication
- Common enums and parameters

**Following Standards:**
- Service-first organization
- OpenAPI documentation
- Type inference
- Validation decorators

### 6. Testing Strategy ✅

**Tests Preserved:**
- Integration tests from pika-old
- Adapted imports for new structure
- Repository integration tests
- Unit tests for core components

**Test Coverage:**
- PDF generation workflow
- Layout engine validation
- QR code generation
- Rate limiting behavior

---

## Migration Challenges & Solutions

### Challenge 1: CQRS to Simple Architecture
**Solution**: Combined read/write handlers into unified services while preserving business logic

### Challenge 2: Fastify to Express
**Solution**: Controllers need adaptation, but business logic remains unchanged

### Challenge 3: io-ts to Zod
**Solution**: Created new Zod schemas following established patterns

### Challenge 4: Import Path Updates
**Solution**: Updated all imports to use new package names and ESM format

---

## Next Steps

### 1. Controller Layer ✅ COMPLETED
- [x] **AdminVoucherBookController**: Full CRUD with proper mappers
- [x] **VoucherBookController (Public)**: Read-only operations
- [x] **Implemented proper error handling and validation**
- [x] **All responses use dedicated mappers (no inline objects)**

### 2. Mapper Implementation ✅ COMPLETED
- [x] **VoucherBookMapper**: Complete with business rules
  - Domain invariants (year 2020-2100, month 1-12)
  - Display formatting (displayName, displayPeriod)
  - Age calculations and "recent" detection
  - Status-based permissions (canBeEdited, canBePublished)
  - Response mappers for all endpoint types
- [x] **AdPlacementMapper**: Space calculation rules (SINGLE=1, QUARTER=2, HALF=4, FULL=8)
- [x] **BookDistributionMapper**: Distribution tracking and state management

### 3. Route Configuration 🔄
- [ ] Set up Express routes
- [ ] Configure authentication middleware
- [ ] Add rate limiting middleware

### 4. API Documentation ⏳
- [ ] Register schemas in OpenAPI generator
- [ ] Document all endpoints
- [ ] Generate SDK types

### 5. Integration Testing ⏳
- [ ] Update integration tests for new controllers
- [ ] Add E2E tests for complete workflows
- [ ] Performance testing

### 6. Deployment ⏳
- [ ] Update Docker configuration
- [ ] Environment variable setup
- [ ] Health check endpoints

---

## Key Decisions Made

1. **Preserve Core Logic**: All sophisticated business logic from pika-old was preserved
2. **Simplify Architecture**: Removed CQRS complexity while keeping functionality
3. **Enhance Security**: Added ownership tracking to all models
4. **Maintain Tests**: Kept integration tests for behavior validation
5. **Use Proven Code**: Reused battle-tested implementations

---

## Success Metrics

- ✅ All core business logic preserved
- ✅ Security enhancements implemented
- ✅ Test coverage maintained
- 🔄 API compatibility (in progress)
- ⏳ Performance benchmarks (pending)

---

## Dependencies

### External Libraries (Preserved)
- `pdfkit`: PDF generation
- `qrcode`: QR code creation
- `sharp`: Image processing
- `lodash-es`: Utilities

### Internal Dependencies (Updated)
- `@pika/shared`: Error handling, logging
- `@pika/redis`: Caching, rate limiting
- `@pika/environment`: Configuration
- `@pika/database`: Prisma client

---

## Risk Mitigation

1. **Business Logic Loss**: Mitigated by copying entire working services
2. **Test Breakage**: Mitigated by preserving integration tests
3. **Performance Degradation**: Mitigated by keeping optimization patterns
4. **Security Vulnerabilities**: Enhanced with new security fields

---

## Conclusion

The PDF service migration successfully extracts and preserves all sophisticated business logic from the old CQRS architecture while adapting to the new simplified Express-based patterns. The core PDF generation, QR code handling, layout engine, and rate limiting features remain intact and production-ready.

**Migration Philosophy**: "Keep what works, adapt what must change, enhance where possible."