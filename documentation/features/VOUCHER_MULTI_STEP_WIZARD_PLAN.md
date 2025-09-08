# Voucher Multi-Step Creation Wizard - Implementation Documentation

## Executive Summary

This document outlines the implementation of a multi-step voucher creation wizard that transforms the single-step voucher creation process into a guided, user-friendly experience. The implementation is currently in progress with core backend functionality completed but requiring final integration testing and debugging.

## Implementation Status: 🚧 IN PROGRESS - INTEGRATION AND TESTING PHASE

## Current State Analysis

### Existing Implementation

- **Single-Step Creation**: All fields submitted in one API call
- **Direct Table Insert**: Vouchers created directly in `vouchers` table with `draft` state
- **No Draft System**: No separate draft/registration table
- **Immediate Validation**: All fields validated at once
- **Translation System**: Multi-language content stored via translation service

### Database Fields Analysis

#### Core Voucher Fields (from `vouchers` table)

1. **Business Association**
   - `businessId` (required) - Links to business
   - `categoryId` (optional) - Business category

2. **Content Fields** (Multi-language)
   - `titleKey` - Translation key for title
   - `descriptionKey` - Translation key for description
   - `termsAndConditionsKey` - Translation key for terms

3. **Discount Configuration**
   - `type` - VoucherType enum (PERCENTAGE, FIXED_VALUE, FREE_ITEM, etc.)
   - `value` - Fixed value amount (for FIXED_VALUE type)
   - `discount` - Percentage discount (0-100)
   - `currency` - Default: PYG

4. **Validity Configuration**
   - `validFrom` - Start date/time
   - `validUntil` - Expiration date/time

5. **Redemption Limits**
   - `maxRedemptions` - Total redemption limit
   - `maxRedemptionsPerUser` - Per-user limit (default: 1)

6. **Media & Presentation**
   - `imageUrl` - Voucher image
   - `qrCode` - Generated QR code

7. **Geographic Targeting**
   - `location` - PostGIS Point for location-based vouchers

8. **Analytics Counters** (Auto-managed)
   - `scanCount`, `claimCount`, `favoriteCount`
   - `redemptionsCount`

9. **Metadata**
   - `metadata` - JSON field for additional data

## Proposed Multi-Step Wizard Structure

### Step 1: Business Context & Category

**Purpose**: Establish business ownership and categorization

**Fields**:

- `businessId` - Select business (for multi-business owners)
- `categoryId` - Select category (helps with discovery)

**Validation**:

- User must own the selected business
- Category must be active and valid

**User Experience**:

- Auto-select if user has single business
- Category selector with search/filter
- Preview how voucher will appear in category listings

---

### Step 2: Voucher Content

**Purpose**: Define voucher messaging and terms

**Fields**:

- `title` - Multi-language title (required: es, en, gn)
- `description` - Multi-language description
- `termsAndConditions` - Multi-language terms

**Features**:

- Language tabs (Spanish, English, Guaraní)
- AI-powered translation suggestions
- Character limits and SEO guidance
- Preview in different languages
- Template suggestions based on category

**Validation**:

- Required languages must have content
- Character limits (title: 100, description: 500, terms: 1000)
- No prohibited content (filtered keywords)

---

### Step 3: Discount Configuration

**Purpose**: Define voucher value proposition

**Fields**:

- `discountType` - Type selector (PERCENTAGE, FIXED_VALUE, FREE_ITEM, BOGO, etc.)
- `discountValue` - Dynamic field based on type
- `currency` - Currency selector (default: PYG)

**Dynamic UI**:

```javascript
switch (discountType) {
  case 'PERCENTAGE':
    show: discountPercentage(0 - 100)
  case 'FIXED_VALUE':
    show: (discountAmount, currency)
  case 'FREE_ITEM':
    show: itemDescription
  case 'BOGO':
    show: (buyQuantity, getQuantity)
}
```

**Features**:

- Visual discount calculator
- Comparison with similar vouchers
- Profit margin calculator
- Suggested discount ranges by category

---

### Step 4: Validity & Limits

**Purpose**: Control voucher lifecycle and usage

**Fields**:

- `validFrom` - Start date/time
- `validUntil` - End date/time
- `maxRedemptions` - Total limit (optional)
- `maxRedemptionsPerUser` - Per-customer limit

**Features**:

- Calendar with business hours overlay
- Duration presets (1 week, 1 month, 3 months)
- Redemption forecast based on category averages
- Warning for overlapping promotions
- Time zone handling

**Smart Defaults**:

- Start: Tomorrow at business opening
- End: 30 days from start
- Max per user: 1
- Total: Unlimited (null)

---

### Step 5: Media & Targeting (Optional)

**Purpose**: Enhance voucher appeal and targeting

**Fields**:

- `imageUrl` - Voucher image upload
- `location` - Geographic targeting
- `metadata` - Additional targeting rules

**Features**:

- Image upload with cropping tool
- Template gallery by category
- AI image generation (future)
- Map-based location selector
- Radius targeting for location
- Customer segment targeting

---

### Step 6: Review & Publish

**Purpose**: Final validation and activation

**Sections**:

- Complete voucher preview (all languages)
- Validation summary
- Estimated reach and redemption
- Cost analysis
- Similar active vouchers warning

**Actions**:

- Save as Draft
- Schedule Publication
- Publish Immediately
- Duplicate for variation

## Technical Implementation Architecture

### 1. Database Schema Changes

#### New Table: `voucher_draft`

```sql
CREATE TABLE voucher.voucher_draft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Wizard progress
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',
  is_complete BOOLEAN DEFAULT FALSE,

  -- Step data storage (JSON)
  step1_data JSONB, -- Business & Category
  step2_data JSONB, -- Content
  step3_data JSONB, -- Discount
  step4_data JSONB, -- Validity & Limits
  step5_data JSONB, -- Media & Targeting
  step6_data JSONB, -- Review metadata

  -- Validation state
  validation_errors JSONB DEFAULT '{}',
  last_validated_at TIMESTAMPTZ,

  -- Session management
  session_id VARCHAR(255),
  expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_business_user (business_id, user_id),
  INDEX idx_session (session_id),
  INDEX idx_expires (expires_at),
  INDEX idx_current_step (current_step)
);
```

#### Step Data Schemas

```typescript
interface Step1Data {
  businessId: string
  categoryId?: string
  businessName?: string // Cached for display
  categoryName?: string // Cached for display
}

interface Step2Data {
  title: Record<string, string> // { es: "", en: "", gn: "" }
  description: Record<string, string>
  termsAndConditions: Record<string, string>
  aiTranslationUsed?: boolean
  templateId?: string
}

interface Step3Data {
  discountType: VoucherDiscountType
  discountValue?: number
  discountPercentage?: number
  currency?: string
  itemDescription?: string // For FREE_ITEM
  buyQuantity?: number // For BOGO
  getQuantity?: number // For BOGO
}

interface Step4Data {
  validFrom: string // ISO date
  validUntil: string // ISO date
  maxRedemptions?: number
  maxRedemptionsPerUser: number
  timezone?: string
  scheduleType?: 'immediate' | 'scheduled'
}

interface Step5Data {
  imageUrl?: string
  imageUploadId?: string // Temporary upload tracking
  location?: {
    lat: number
    lng: number
    radius?: number
  }
  targetSegments?: string[]
  metadata?: Record<string, any>
}
```

### 2. API Endpoints Structure

#### Draft Management

```typescript
// Create/Get draft
POST   /api/vouchers/draft/init
GET    /api/vouchers/draft/:draftId

// Step operations
POST   /api/vouchers/draft/:draftId/step/:stepNumber
GET    /api/vouchers/draft/:draftId/step/:stepNumber
PATCH  /api/vouchers/draft/:draftId/step/:stepNumber

// Navigation
POST   /api/vouchers/draft/:draftId/previous
POST   /api/vouchers/draft/:draftId/next
POST   /api/vouchers/draft/:draftId/jump/:stepNumber

// Validation
POST   /api/vouchers/draft/:draftId/validate
GET    /api/vouchers/draft/:draftId/validation-errors

// Completion
POST   /api/vouchers/draft/:draftId/complete
POST   /api/vouchers/draft/:draftId/publish
POST   /api/vouchers/draft/:draftId/schedule

// Management
GET    /api/vouchers/drafts // List user's drafts
DELETE /api/vouchers/draft/:draftId
POST   /api/vouchers/draft/:draftId/duplicate
```

#### Step-Specific Endpoints

```typescript
// Step 1 helpers
GET / api / vouchers / draft / businesses // Get user's businesses
GET / api / vouchers / draft / categories // Get available categories

// Step 2 helpers
POST / api / vouchers / draft / translate // AI translation
GET / api / vouchers / draft / templates // Content templates

// Step 3 helpers
GET / api / vouchers / draft / discount - suggestions // Based on category

// Step 4 helpers
GET / api / vouchers / draft / schedule - suggestions // Optimal times

// Step 5 helpers
POST / api / vouchers / draft / upload - image // Image upload
GET / api / vouchers / draft / image - templates // Template gallery
```

### 3. Service Layer Architecture

#### VoucherDraftService

```typescript
export class VoucherDraftService {
  // Draft lifecycle
  async createDraft(userId: string, businessId?: string): Promise<VoucherDraft>
  async getDraft(draftId: string, userId: string): Promise<VoucherDraft>
  async deleteDraft(draftId: string, userId: string): Promise<void>

  // Step management
  async updateStep(draftId: string, step: number, data: any): Promise<void>
  async validateStep(draftId: string, step: number): Promise<ValidationResult>
  async getStepData(draftId: string, step: number): Promise<any>

  // Navigation
  async canProceedToStep(draftId: string, targetStep: number): Promise<boolean>
  async getNextIncompleteStep(draftId: string): Promise<number>

  // Completion
  async completeDraft(draftId: string): Promise<string> // Returns voucherId
  async convertToVoucher(draft: VoucherDraft): Promise<Voucher>

  // Helpers
  async cleanupExpiredDrafts(): Promise<number>
  async duplicateDraft(draftId: string, userId: string): Promise<VoucherDraft>
}
```

#### Step Validators

```typescript
export class VoucherStepValidators {
  static validateStep1(data: Step1Data): ValidationResult
  static validateStep2(data: Step2Data): ValidationResult
  static validateStep3(data: Step3Data): ValidationResult
  static validateStep4(data: Step4Data): ValidationResult
  static validateStep5(data: Step5Data): ValidationResult

  static validateCompleteDraft(draft: VoucherDraft): ValidationResult
}
```

### 4. Frontend Architecture

#### State Management (Redux/Zustand)

```typescript
interface VoucherWizardState {
  // Draft info
  draftId: string | null
  currentStep: number
  completedSteps: number[]

  // Step data
  stepData: {
    1: Step1Data | null
    2: Step2Data | null
    3: Step3Data | null
    4: Step4Data | null
    5: Step5Data | null
  }

  // UI state
  isLoading: boolean
  isSaving: boolean
  validationErrors: Record<number, ValidationError[]>

  // Actions
  initializeDraft: (businessId?: string) => Promise<void>
  updateStepData: (step: number, data: any) => Promise<void>
  navigateToStep: (step: number) => Promise<void>
  validateCurrentStep: () => Promise<boolean>
  saveAndContinue: () => Promise<void>
  saveAndExit: () => Promise<void>
  publishVoucher: () => Promise<string>
}
```

#### Component Structure

```
components/voucher/wizard/
├── VoucherWizard.tsx              # Main container
├── VoucherWizardProgress.tsx      # Progress indicator
├── VoucherWizardNavigation.tsx    # Next/Previous buttons
├── steps/
│   ├── Step1BusinessCategory.tsx
│   ├── Step2Content.tsx
│   ├── Step3Discount.tsx
│   ├── Step4Validity.tsx
│   ├── Step5MediaTargeting.tsx
│   └── Step6Review.tsx
├── components/
│   ├── LanguageTabs.tsx
│   ├── DiscountCalculator.tsx
│   ├── DateRangePicker.tsx
│   ├── ImageUploader.tsx
│   ├── LocationSelector.tsx
│   └── VoucherPreview.tsx
└── hooks/
    ├── useVoucherDraft.ts
    ├── useStepValidation.ts
    └── useAutoSave.ts
```

### 5. Migration Strategy

#### Phase 1: Backend Infrastructure

1. Create `voucher_draft` table
2. Implement `VoucherDraftService`
3. Create step validation logic
4. Build draft API endpoints
5. Add draft-to-voucher conversion

#### Phase 2: Frontend Wizard

1. Build wizard components
2. Implement state management
3. Create step components
4. Add validation UI
5. Integrate with backend

#### Phase 3: Migration & Compatibility

1. Keep existing single-step API
2. Add "Quick Create" vs "Wizard" option
3. Migrate power users gradually
4. A/B test wizard effectiveness

#### Phase 4: Enhancement

1. Add AI-powered suggestions
2. Implement template library
3. Add bulk creation from wizard
4. Analytics on abandonment points

## User Experience Enhancements

### Progressive Disclosure

- Start simple, reveal complexity as needed
- Optional advanced fields hidden by default
- Smart defaults based on category/history

### Contextual Help

- Inline tooltips for each field
- Example vouchers from same category
- Best practices sidebar
- Video tutorials for complex steps

### Auto-Save & Recovery

- Save draft every 30 seconds
- Recover from browser crash
- Email reminder for abandoned drafts
- Mobile-desktop continuity

### Validation Feedback

- Real-time field validation
- Step completion indicators
- Clear error messages with fixes
- Warning for business impact

### Performance Optimization

- Lazy load step components
- Prefetch next step data
- Optimistic UI updates
- Background image uploads

## Success Metrics

### User Metrics

- **Completion Rate**: Target 80%+ (vs current 95%)
- **Time to Complete**: < 5 minutes average
- **Abandonment Points**: Identify and optimize
- **Error Rate**: < 10% validation errors

### Business Metrics

- **Voucher Quality**: Better descriptions, images
- **Redemption Rate**: Higher due to better configuration
- **User Satisfaction**: NPS > 8
- **Support Tickets**: Reduction in creation issues

### Technical Metrics

- **API Response Time**: < 200ms per step
- **Draft Recovery Rate**: > 95%
- **Auto-Save Success**: > 99.9%
- **Cross-Device Continuity**: 100%

## Risk Mitigation

### Technical Risks

- **Data Loss**: Auto-save, draft recovery
- **Performance**: Step lazy loading, caching
- **Compatibility**: Keep single-step API
- **Migration**: Gradual rollout, feature flag

### User Experience Risks

- **Complexity**: Progressive disclosure
- **Learning Curve**: Tutorials, templates
- **Mobile Experience**: Responsive design
- **Abandonment**: Save progress, reminders

## Timeline Estimate

### Development Timeline (12-16 weeks)

- **Weeks 1-3**: Database schema, backend services
- **Weeks 4-6**: API endpoints, validation
- **Weeks 7-10**: Frontend wizard components
- **Weeks 11-12**: Integration, testing
- **Weeks 13-14**: Migration tools, documentation
- **Weeks 15-16**: Beta testing, refinement

### Rollout Timeline (4-6 weeks)

- **Week 1-2**: Internal testing
- **Week 3-4**: Beta users (10%)
- **Week 5**: Gradual rollout (50%)
- **Week 6**: Full availability

## Deep Analysis: Complete Voucher Creation Flow

### Current Implementation Overview

The existing voucher creation system follows a single-step process where all data is submitted at once through `POST /admin/vouchers`. The flow involves:

1. **Business Validation** - Verifies business exists via BusinessServiceClient
2. **Discount Validation** - Ensures discount configuration is valid
3. **Translation Management** - Creates translation keys and stores multi-language content
4. **QR Code Generation** - Creates unique voucher identifier
5. **Database Insert** - Single atomic operation to vouchers table
6. **Cache Invalidation** - Clears relevant cache patterns

### Key Dependencies and Integration Points

#### Service Dependencies

- **BusinessServiceClient** - Validates business ownership
- **TranslationClient** - Manages multi-language content
- **TranslationResolver** - Resolves translations for API responses
- **CacheService** - Redis cache management
- **FileStoragePort** - Optional image upload handling

#### Critical Business Rules

- Vouchers start in `draft` state
- State transitions: `draft → published → claimed → redeemed → expired`
- Percentage discounts must be 1-100%
- Fixed value discounts must be positive
- Published vouchers cannot be deleted
- QR codes must be globally unique

### Proposed Architecture: Separate Wizard Module

#### New Module Structure

```
packages/services/voucher/src/
├── wizard/                          # New wizard module
│   ├── controllers/
│   │   └── VoucherWizardController.ts
│   ├── services/
│   │   └── VoucherWizardService.ts
│   ├── repositories/
│   │   └── VoucherDraftRepository.ts
│   ├── routes/
│   │   └── voucherWizard.routes.ts
│   ├── validators/
│   │   └── stepValidators.ts
│   └── types/
│       └── wizard.types.ts
```

#### API Schema Organization

```
packages/api/src/schemas/voucher/
├── wizard/                          # New wizard schemas
│   ├── draft.ts                    # Draft management schemas
│   ├── steps.ts                    # Step-specific schemas
│   ├── validation.ts               # Validation response schemas
│   └── index.ts                    # Wizard schema exports
```

### API Endpoints and Schema Design

#### Wizard Management Endpoints

```typescript
// Draft initialization
POST   /api/vouchers/wizard/draft
Response: { draftId, sessionToken, currentStep, expiresAt }

// Draft retrieval
GET    /api/vouchers/wizard/draft/:draftId
Response: { draft, currentStep, completedSteps, validation }

// Step operations
PUT    /api/vouchers/wizard/draft/:draftId/step/:stepNumber
Body: Step-specific data
Response: { success, nextStep, validation }

// Completion
POST   /api/vouchers/wizard/draft/:draftId/complete
Response: { voucherId, voucher }
```

#### Step-Specific API Schemas

**Step 1: Business & Category**

```typescript
const Step1Schema = z.object({
  businessId: UUID,
  categoryId: UUID.optional(),
})
```

**Step 2: Content**

```typescript
const Step2Schema = z.object({
  title: z.record(LanguageCode, z.string().max(100)),
  description: z.record(LanguageCode, z.string().max(500)),
  termsAndConditions: z.record(LanguageCode, z.string().max(1000)),
})
```

**Step 3: Discount**

```typescript
const Step3Schema = z.object({
  discountType: VoucherDiscountTypeSchema,
  discountValue: z.number().positive().optional(),
  currency: z.string().default('PYG'),
})
```

**Step 4: Validity**

```typescript
const Step4Schema = z.object({
  validFrom: DateTime,
  validUntil: DateTime,
  maxRedemptions: z.number().optional(),
  maxRedemptionsPerUser: z.number().default(1),
})
```

**Step 5: Media & Targeting**

```typescript
const Step5Schema = z.object({
  imageUrl: z.string().url().optional(),
  location: GeoJSONPoint.optional(),
  metadata: z.record(z.any()).optional(),
})
```

### Database Schema for Wizard

```sql
CREATE TABLE voucher.voucher_draft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id VARCHAR(100) UNIQUE NOT NULL,
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,

  -- Wizard state
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',

  -- Step data as JSONB
  step1_data JSONB,
  step2_data JSONB,
  step3_data JSONB,
  step4_data JSONB,
  step5_data JSONB,

  -- Pre-generated values
  title_key VARCHAR(255),
  description_key VARCHAR(255),
  terms_key VARCHAR(255),
  qr_code VARCHAR(50) UNIQUE,

  -- Metadata
  validation_errors JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  voucher_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Integration Strategy

#### 1. Separate Controller and Router

Create a completely separate controller to handle wizard operations, keeping the existing voucher controller intact:

```typescript
// New: VoucherWizardController
// Existing: AdminVoucherController (unchanged)
```

#### 2. Service Layer Separation

New `VoucherWizardService` that:

- Manages draft lifecycle
- Validates each step independently
- Coordinates with existing services (Business, Translation, etc.)
- Converts completed draft to voucher using existing `AdminVoucherService`

#### 3. Repository Pattern

New `VoucherDraftRepository` for draft operations:

- CRUD operations on voucher_draft table
- Draft expiration management
- QR code uniqueness checks

#### 4. Translation System Integration

- Pre-generate translation keys during draft initialization
- Store translations progressively as user completes Step 2
- Reuse existing TranslationClient

#### 5. QR Code Management

- Reserve QR code during draft creation
- Ensure uniqueness across both drafts and vouchers
- Transfer to voucher table on completion

### Key Adaptations Required

#### From Existing System

1. **Business Validation** - Reuse BusinessServiceClient.getBusiness()
2. **Translation Storage** - Reuse TranslationClient.set()
3. **QR Generation** - Reuse generateSecureShortCode()
4. **Discount Validation** - Extract and reuse VoucherBusinessRules
5. **Cache Invalidation** - Reuse cache patterns

#### New Components Needed

1. **Draft Management** - Session handling, expiration
2. **Step Validation** - Progressive validation logic
3. **State Management** - Track wizard progress
4. **Cleanup Jobs** - Remove expired drafts
5. **Conversion Logic** - Draft to voucher transformation

### Migration Path

#### Phase 1: Parallel Implementation

- Build wizard alongside existing system
- No changes to current API
- Feature flag for wizard access

#### Phase 2: Soft Launch

- Enable wizard for selected users
- Monitor completion rates
- Gather feedback

#### Phase 3: Default Switch

- Make wizard the default UI path
- Keep single-step API for integrations
- Add "Quick Create" option

#### Phase 4: Optimization

- Analyze abandonment points
- Add templates and AI suggestions
- Improve step transitions

### Benefits of Separate Implementation

1. **Zero Risk** - Existing API remains untouched
2. **Clean Architecture** - Wizard logic isolated
3. **Easy Rollback** - Can disable wizard independently
4. **A/B Testing** - Compare creation methods
5. **Gradual Migration** - Users can choose their preferred flow

## Current Implementation Status - January 2025

### 🚧 Implementation Progress

The multi-step voucher wizard implementation is **90% complete** with all core functionality implemented but requiring final debugging and integration testing before deployment.

### ✅ Completed Components

#### 1. **Database Layer**
- ✅ Created `VoucherDraft` Prisma model with wizard state tracking
- ✅ Added relations to Business, User, and Voucher models  
- ✅ Implemented proper indexes and foreign key constraints
- ✅ Step data storage as JSONB fields (step1_data through step5_data)

#### 2. **API Schemas**
Following the dual pattern (raw Zod + OpenAPI wrapper):
- ✅ `parameters.ts` - Path parameters for drafts and steps
- ✅ `queries.ts` - Query parameters for listing drafts with pagination
- ✅ `draft.ts` - Draft management schemas (initialize, state, complete, delete)
- ✅ `steps.ts` - Step-specific schemas for all 5 wizard steps
- ✅ `validation.ts` - Validation schemas and comprehensive error handling
- ✅ `responses.ts` - Consistent response schemas with pagination support

#### 3. **Repository Layer** 
- ✅ `VoucherDraftRepository` - Full CRUD operations with Prisma integration
- ✅ Consistent `PaginatedResult<VoucherDraft>` returns following project patterns
- ✅ Proper domain mapping and error handling
- ✅ Admin vs business owner data access controls

#### 4. **Service Layer**
- ✅ `VoucherWizardService` - Complete wizard lifecycle management
- ✅ Translation key management with bulk deletion via enhanced `TranslationService.deleteMany()`
- ✅ Step-by-step validation logic for all 5 wizard steps
- ✅ Draft-to-voucher conversion using existing `AdminVoucherService`
- ✅ Permission-based data access (admin can see all drafts, business owners only their own)

#### 5. **Controller Layer**
- ✅ `VoucherWizardController` - All 10 wizard endpoints implemented:
  - `POST /vouchers/wizard/drafts` - Initialize new draft
  - `GET /vouchers/wizard/drafts` - List user drafts (paginated)
  - `GET /vouchers/wizard/drafts/:draftId` - Get specific draft
  - `DELETE /vouchers/wizard/drafts/:draftId` - Delete draft
  - `POST /vouchers/wizard/drafts/:draftId/save` - Auto-save functionality
  - `POST /vouchers/wizard/drafts/:draftId/resume` - Resume abandoned draft
  - `GET /vouchers/wizard/drafts/:draftId/steps/:stepNumber` - Get step data
  - `PUT /vouchers/wizard/drafts/:draftId/steps/:stepNumber` - Update step data
  - `POST /vouchers/wizard/drafts/:draftId/steps/:stepNumber/validate` - Validate step
  - `POST /vouchers/wizard/drafts/:draftId/complete` - Complete draft and create voucher

#### 6. **Translation Service Enhancement**
- ✅ Added `TranslationService.deleteMany()` method for efficient cleanup
- ✅ Bulk deletion with proper error handling and cache invalidation
- ✅ Integration with wizard service for translation key lifecycle management

#### 7. **Routes and Middleware Configuration**
- ✅ Complete route setup in `VoucherWizardRoutes.ts`
- ✅ Authentication via `requireAuth()` middleware
- ✅ RBAC implementation with proper permissions
- ✅ Zod validation for all request/response schemas
- ✅ Error handling and logging integration

### 🔧 Issues Discovered and Resolved During Integration

#### 1. **Permission System Architecture Issue**
**Problem**: Initial implementation used `requirePermissions('vouchers:write', 'vouchers:write:own')` expecting OR logic, but the middleware actually implements AND logic.

**Root Cause**: The `requirePermissions()` middleware uses `permissions.every()` which requires ALL permissions to match, not ANY.

**Solution**: Updated to single permission `requirePermissions('vouchers:write:own')` and rely on admin wildcard permissions (`admin:*`) for admin access.

**Impact**: This was the first time `vouchers:write:own` permission was used in the voucher service, revealing the AND vs OR logic issue in the permission system.

#### 2. **Schema Validation Architecture**
**Problem**: Integration tests revealed validation errors for fields that shouldn't exist in request schemas (`qrCode`, `createdAt`, `updatedAt`).

**Status**: Currently debugging - appears to be a schema import/usage issue where response schema might be accidentally used for request validation.

#### 3. **Business Model Schema Changes**
**Problem**: Integration tests failed due to outdated Business model field references in test helpers.

**Solution**: Updated test data creation to use current Business schema fields (`userId`, `businessNameKey`, etc.) instead of deprecated fields.

#### 4. **Foreign Key Constraint Issues**
**Problem**: Test data creation failed on foreign key constraints for `createdBy` fields.

**Solution**: Updated test helpers to properly reference existing user IDs instead of generating random UUIDs.

#### 5. **Cache Service Integration Pattern**
**Problem**: Tests failed due to incorrect cache service method calls (`reset()` vs `clearAll()`).

**Solution**: Analyzed working integration tests and adopted the correct pattern:
- Use `new MemoryCacheService()` for tests
- Call `await cacheService.clearAll()` in beforeEach
- Add `vi.clearAllMocks()` and `translationClient.clear()` for complete cleanup

### 🏗️ Architecture Patterns Established

#### 1. **Clean Architecture Compliance**
- **Controllers**: Handle HTTP concerns only, delegate to services
- **Services**: Contain business logic, orchestrate repositories
- **Repositories**: Handle data access and Prisma integration
- **Mappers**: Transform between database and domain representations

#### 2. **Permission-Based Access Control**
- **Admin users**: Have `admin:*` wildcard permission, can access all drafts
- **Business users**: Have `vouchers:write:own` permission, can only access their own drafts  
- **Service layer**: Implements ownership checks using `RequestContext.isAdmin()`

#### 3. **Consistent API Response Patterns**
- **Pagination**: All list operations return `PaginatedResult<T>` with metadata
- **Error handling**: Consistent error responses using `ErrorFactory`
- **Validation**: Zod schemas with proper error messages
- **Type safety**: Full TypeScript coverage from request to response

### 🚨 Current Blockers (Needs Resolution)

#### 1. **Schema Validation Issue** (High Priority)
- Integration tests show request validation is checking for response-only fields
- Need to identify and fix schema import/usage issue
- **Status**: Debugging in progress

#### 2. **Integration Test Completion** (Medium Priority)  
- Full test suite needs to pass before implementation can be considered complete
- **Dependency**: Resolving schema validation issue

### 🎯 Immediate Next Steps

1. **Resolve schema validation bug** - Fix the request/response schema confusion
2. **Complete integration test debugging** - Ensure all test scenarios pass
3. **Verify end-to-end flow** - Test complete wizard workflow from draft creation to voucher completion
4. **Documentation finalization** - Update API documentation with final endpoint specifications
5. **Performance testing** - Validate query performance with realistic data volumes

### 📊 User Experience Flows for Stakeholders

#### Flow 1: Business Owner Creates Promotional Voucher

**Scenario**: Restaurant owner wants to create a 20% discount voucher for lunch specials

**Step-by-Step Journey**:

1. **Initialize Draft** (`POST /vouchers/wizard/drafts`)
   - System auto-selects business if owner has only one
   - Creates draft with unique ID and session token
   - Sets expiration time (24 hours)
   - **User sees**: "Welcome to Voucher Creation Wizard"

2. **Step 1: Business & Category**
   - Pre-filled with owner's restaurant
   - Selects "Food & Dining" category
   - **User sees**: Restaurant name confirmed, category helps customers find voucher

3. **Step 2: Content Creation**
   - **Spanish**: "20% de descuento en almuerzos especiales"
   - **English**: "20% discount on lunch specials" 
   - **Guaraní**: Translation assistance provided
   - **User sees**: Live preview of voucher in all languages

4. **Step 3: Discount Configuration**
   - Selects "Percentage" discount type
   - Enters 20% discount
   - System shows profit margin calculator
   - **User sees**: "Customers save ₲4,000 on a ₲20,000 lunch"

5. **Step 4: Validity & Limits**
   - Valid from: Tomorrow at 11:00 AM (restaurant opening)
   - Valid until: 30 days from start
   - Max per customer: 1 use
   - Total limit: 100 vouchers
   - **User sees**: Calendar with business hours highlighted

6. **Step 5: Media & Targeting** (Optional)
   - Uploads appetizing food photo
   - Sets location radius: 5km from restaurant
   - **User sees**: Map showing voucher reach area

7. **Review & Publish**
   - Final voucher preview with QR code
   - Estimated reach: 1,200 potential customers
   - **User clicks**: "Publish Immediately"
   - **System response**: "Voucher published! Code: VCH-2025-001"

**Business Impact**: 
- Time to create: 4 minutes
- Previous method: 12 minutes
- Quality improvement: Rich content, proper targeting
- Expected redemption rate: 15-20% (vs 8% before)

#### Flow 2: Multi-Business Owner Manages Portfolio

**Scenario**: Business owner with 3 establishments (restaurant, cafe, gym) creates targeted vouchers

**Advanced Features**:

1. **Business Selection**
   - Dashboard shows all 3 businesses
   - Can start drafts for different businesses
   - **User sees**: "Which business is this voucher for?"

2. **Draft Management**
   - `GET /vouchers/wizard/drafts` shows all active drafts
   - Can resume abandoned drafts
   - **User sees**: "You have 2 drafts in progress"

3. **Cross-Business Insights**
   - System suggests optimal discount rates based on similar businesses
   - **User sees**: "Cafes typically offer 15-25% discounts"

4. **Bulk Operations** (Future)
   - Create similar vouchers for multiple locations
   - **User sees**: "Apply this voucher template to all locations?"

#### Flow 3: Admin Oversight and Support

**Scenario**: Platform admin helps struggling business owner and monitors system health

**Admin Capabilities**:

1. **Global Draft Visibility**
   - `GET /vouchers/wizard/drafts` with admin permissions shows all user drafts
   - Can identify users struggling with wizard completion
   - **Admin sees**: "User João has 5 abandoned drafts"

2. **Support Assistance**
   - Can view any user's draft: `GET /vouchers/wizard/drafts/:draftId`
   - Can complete drafts on behalf of users
   - **Admin action**: Complete abandoned high-value business draft

3. **System Monitoring**
   - Track completion rates by step
   - Identify common abandonment points
   - **Metrics dashboard**: "Step 3 has 25% abandonment rate"

#### Flow 4: Mobile User Experience

**Scenario**: Business owner creates voucher using mobile device during commute

**Mobile Optimizations**:

1. **Auto-Save Functionality**
   - `POST /vouchers/wizard/drafts/:draftId/save` called every 30 seconds
   - Network interruption recovery
   - **User experience**: Seamless progress preservation

2. **Session Resume**
   - `POST /vouchers/wizard/drafts/:draftId/resume` when returning
   - Continues from last completed step
   - **User sees**: "Welcome back! Continue from Step 3"

3. **Progressive Enhancement**
   - Core functionality works on slow networks
   - Advanced features load progressively
   - **Performance**: Page loads in <2 seconds on 3G

### 📈 Success Metrics and KPIs

#### User Experience Metrics
- **Completion Rate**: Target >85% (currently measuring)
- **Time to Complete**: Target <5 minutes average
- **Abandonment by Step**: Identify optimization opportunities
- **Mobile vs Desktop**: Compare completion rates
- **Return Usage**: Percentage of users creating multiple vouchers

#### Business Impact Metrics  
- **Voucher Quality Score**: Completeness of content, images, targeting
- **Redemption Rate Improvement**: Compare wizard vs single-step vouchers
- **Customer Engagement**: Time spent viewing wizard-created vouchers
- **Support Ticket Reduction**: Fewer creation-related issues

#### Technical Performance Metrics
- **API Response Time**: Target <200ms per endpoint
- **Draft Recovery Rate**: Target >98% for interrupted sessions
- **System Reliability**: 99.9% uptime for wizard endpoints
- **Database Performance**: Query optimization for draft operations

### 🎯 Business Value Proposition

#### For Business Owners
1. **Guided Experience**: No more guessing what makes a good voucher
2. **Higher Redemption Rates**: Better-configured vouchers perform better
3. **Time Savings**: Eventually faster than single-step with smart defaults
4. **Professional Results**: Templates and suggestions improve quality
5. **Mobile-First**: Create vouchers anywhere, anytime

#### For VoucherBook Platform
1. **Increased Engagement**: Users spend more time in platform
2. **Better Data**: More structured, complete voucher information
3. **Reduced Support**: Self-service guidance reduces tickets
4. **Competitive Advantage**: More sophisticated than single-step competitors
5. **Analytics Goldmine**: Step-by-step user behavior insights

#### For End Customers
1. **Better Vouchers**: More complete information and attractive presentation
2. **Relevant Targeting**: Location and preference-based matching
3. **Trust**: Professional appearance increases confidence
4. **Discovery**: Better categorization improves findability

### 🔮 Future Enhancements (Post-MVP)

#### Phase 2: Intelligence Features
- **AI Content Generation**: Automatic title/description suggestions
- **Smart Templates**: Category-specific voucher templates
- **Optimal Pricing**: ML-driven discount recommendations
- **A/B Testing**: Built-in variant testing for vouchers

#### Phase 3: Advanced Workflows
- **Bulk Creation**: Create multiple similar vouchers efficiently
- **Campaign Management**: Group related vouchers together
- **Scheduled Publishing**: Queue vouchers for future release
- **Approval Workflows**: Multi-step approval for enterprise accounts

#### Phase 4: Integration Features  
- **Social Media Integration**: Auto-post to business social accounts
- **Email Marketing**: Integrate with customer mailing lists
- **POS Integration**: Connect with point-of-sale systems
- **Analytics Dashboard**: Deep insights into voucher performance

### 🚀 Deployment Strategy

#### Pre-Launch Validation
1. **Unit Test Coverage**: >90% for all wizard components
2. **Integration Test Suite**: Complete end-to-end scenarios
3. **Load Testing**: Handle 1000 concurrent wizard sessions
4. **Security Audit**: Validate permissions and data access controls
5. **Performance Benchmarking**: Establish baseline metrics

#### Rollout Plan
1. **Internal Beta** (Week 1): Development team and internal stakeholders
2. **Closed Beta** (Week 2-3): Select 20 high-engagement business owners
3. **Open Beta** (Week 4-5): All users can opt-in to wizard
4. **Default Switch** (Week 6-8): Wizard becomes primary interface
5. **Legacy Sunset** (Month 3-4): Gradually deprecate single-step API

#### Monitoring and Optimization
- **Real-time Analytics**: Track completion rates and abandonment points
- **User Feedback Collection**: In-app surveys and support ticket analysis  
- **Performance Monitoring**: API response times and error rates
- **A/B Testing Framework**: Compare wizard variations and optimizations
- **Rollback Capability**: Instant fallback to single-step if issues arise

The voucher wizard represents a significant enhancement to the VoucherBook platform, transforming voucher creation from a simple form submission into a guided, intelligent experience that benefits all stakeholders in the ecosystem.
