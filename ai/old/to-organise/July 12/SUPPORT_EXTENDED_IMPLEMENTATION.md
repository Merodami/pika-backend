# Support Service Extended Implementation Analysis

## Overview

This document outlines the backend extensions needed to implement comprehensive admin support ticket functionality based on analysis of the existing codebase, SDK requirements, and established patterns from the User service.

## Current Implementation Status

### ✅ Already Implemented

- **SDK Integration**: `getSupportTickets` method exists and is properly typed in admin SDK
- **API Schemas**: Comprehensive admin schemas are defined and registered in `/packages/api/src/admin/schemas/support/`
- **Database Foundation**: Core Problem model exists with basic support ticket functionality
- **Basic CRUD**: User-level operations for creating and viewing support tickets
- **Clean Architecture**: Proper Controller → Service → Repository pattern established
- **Infrastructure**: Caching, authentication, and validation middleware in place

### ❌ Missing Implementation

## Required Backend Extensions

### 1. Admin Route Structure (Critical Priority)

**Current State:**

```typescript
// packages/services/support/src/server.ts
app.use('/problems', problemRouter) // Only regular user routes
```

**Required Implementation:**

```typescript
// packages/services/support/src/server.ts
app.use('/problems', problemRouter) // Existing user routes
app.use('/admin/support', adminSupportRouter) // Missing admin routes
```

**Critical Issue:** SDK expects `/support/tickets` but service serves `/problems`

### 2. Missing Admin Files

Following the User service pattern, these files need to be created:

**Required Files:**

- `packages/services/support/src/controllers/AdminSupportController.ts` (Missing)
- `packages/services/support/src/routes/AdminSupportRoutes.ts` (Missing)

**File Structure Pattern (Following User Service):**

```
packages/services/support/src/
├── controllers/
│   ├── AdminSupportController.ts    # New - Admin ticket management
│   ├── ProblemController.ts         # Existing - Regular user operations
│   └── CommentController.ts         # Existing - Comment operations
└── routes/
    ├── AdminSupportRoutes.ts        # New - Admin route definitions
    ├── problemRoutes.ts             # Existing - Regular user routes
    └── commentRoutes.ts             # Existing - Comment routes
```

### 3. Required Admin Endpoints

Based on SDK and schema analysis, these endpoints must be implemented:

```typescript
// Admin Support Ticket Management
GET    /admin/support/tickets              // List all tickets (getSupportTickets)
GET    /admin/support/tickets/:id          // Get ticket details
PUT    /admin/support/tickets/:id          // Update ticket
DELETE /admin/support/tickets/:id          // Delete ticket
POST   /admin/support/tickets/:id/assign   // Assign ticket to admin
POST   /admin/support/tickets/:id/escalate // Escalate ticket
PUT    /admin/support/tickets/:id/status   // Update ticket status

// Admin Analytics & Bulk Operations
GET    /admin/support/tickets/analytics    // Ticket analytics
POST   /admin/support/tickets/bulk         // Bulk operations
GET    /admin/support/agents/performance   // Agent performance metrics
```

### 4. Database Schema Extensions

The current Problem model is missing critical admin fields:

**Current Problem Model:**

```prisma
model Problem {
  id          String          @id @default(dbgenerated("gen_random_uuid()"))
  userId      String          @map("user_id")
  title       String          @db.VarChar(255)
  description String          @db.Text
  status      ProblemStatus   @default(OPEN)
  priority    ProblemPriority @default(MEDIUM)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime?       @default(now()) @updatedAt
  resolvedAt  DateTime?       @map("resolved_at")

  user     User             @relation(fields: [userId], references: [id])
  comments SupportComment[]
}
```

**Required Extensions:**

```prisma
model Problem {
  // ... existing fields ...

  // Missing Admin Fields
  ticketNumber    String?    @unique @map("ticket_number")    # Auto-generated ticket number
  assignedTo      String?    @map("assigned_to")             # Admin user ID
  assignedToName  String?    @map("assigned_to_name")        # Admin user name (denormalized)
  assignedAt      DateTime?  @map("assigned_at")             # Assignment timestamp
  firstResponseAt DateTime?  @map("first_response_at")       # First admin response
  isEscalated     Boolean    @default(false) @map("is_escalated") # Escalation flag
  category        ProblemCategory @default(GENERAL)          # Extended categorization

  // Relations
  assignedToUser  User?      @relation("AssignedProblems", fields: [assignedTo], references: [id])
}
```

**Required Enum Extensions:**

```prisma
enum ProblemStatus {
  OPEN
  ASSIGNED            # Missing
  IN_PROGRESS
  WAITING_CUSTOMER    # Missing
  WAITING_INTERNAL    # Missing
  RESOLVED
  CLOSED
}

enum ProblemPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
  CRITICAL            # Missing
}

enum ProblemCategory {  # Missing enum
  BILLING
  TECHNICAL
  ACCOUNT
  BOOKING
  GYM_ISSUE
  TRAINER_ISSUE
  GENERAL
  BUG_REPORT
  FEATURE_REQUEST
}
```

### 5. Enhanced Query Support

The current ProblemRepository needs admin-level filtering capabilities:

**Missing Query Parameters:**

```typescript
interface AdminTicketSearchParams {
  // Existing
  search?: string
  status?: ProblemStatus
  priority?: ProblemPriority
  userId?: string

  // Missing Admin Parameters
  ticketNumber?: string
  assignedTo?: string
  category?: ProblemCategory
  isEscalated?: boolean
  fromDate?: string
  toDate?: string

  // Enhanced filtering
  hasFirstResponse?: boolean
  responseTimeMin?: number
  responseTimeMax?: number

  // Pagination & Sorting
  page?: number
  limit?: number
  sort?: 'CREATED_AT' | 'UPDATED_AT' | 'PRIORITY' | 'STATUS'
  order?: 'ASC' | 'DESC'
}
```

### 6. Admin Service Layer Extensions

**Required Service Methods:**

```typescript
interface IAdminSupportService {
  // Ticket Management
  getAllTickets(params: AdminTicketSearchParams): Promise<PaginatedResult<Problem>>
  getTicketById(id: string): Promise<Problem | null>
  updateTicket(id: string, updates: AdminTicketUpdate): Promise<Problem>
  deleteTicket(id: string): Promise<void>

  // Assignment & Escalation
  assignTicket(ticketId: string, adminId: string): Promise<Problem>
  unassignTicket(ticketId: string): Promise<Problem>
  escalateTicket(ticketId: string, reason: string): Promise<Problem>
  updateTicketStatus(ticketId: string, status: ProblemStatus): Promise<Problem>

  // Bulk Operations
  bulkUpdateTickets(updates: BulkTicketUpdate[]): Promise<Problem[]>
  bulkAssignTickets(ticketIds: string[], adminId: string): Promise<Problem[]>

  // Analytics
  getTicketAnalytics(params: AnalyticsParams): Promise<TicketAnalytics>
  getAgentPerformance(params: PerformanceParams): Promise<AgentPerformance[]>
}
```

### 7. Admin Controller Implementation

Following the User service pattern:

**Required Controller Structure:**

```typescript
export class AdminSupportController {
  constructor(
    private readonly supportService: ISupportService,
    private readonly adminSupportService: IAdminSupportService,
  ) {
    // Bind methods to preserve 'this' context
    this.getAllTickets = this.getAllTickets.bind(this)
    this.getTicketById = this.getTicketById.bind(this)
    this.updateTicket = this.updateTicket.bind(this)
    this.assignTicket = this.assignTicket.bind(this)
    this.escalateTicket = this.escalateTicket.bind(this)
    this.getAnalytics = this.getAnalytics.bind(this)
  }

  // Implementation following User service patterns...
}
```

**Required Route Configuration:**

```typescript
export function createAdminSupportRouter(prisma: PrismaClient, cache: ICacheService): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new ProblemRepository(prisma, cache)
  const service = new ProblemService(repository, cache)
  const adminService = new AdminSupportService(repository, cache)
  const controller = new AdminSupportController(service, adminService)

  // Admin ticket management routes
  router.get('/tickets', requireAuth(), requireAdmin(), validateQuery(AdminTicketSearchParams), controller.getAllTickets)

  router.get('/tickets/:id', requireAuth(), requireAdmin(), validateParams(TicketIdParam), controller.getTicketById)

  // ... more route definitions

  return router
}
```

## Implementation Phases

### Phase 1: Core Admin Routes (High Priority)

1. Create `AdminSupportController.ts` following User service pattern
2. Create `AdminSupportRoutes.ts` with basic CRUD operations
3. Mount admin routes at `/admin/support` in server.ts
4. Implement basic ticket listing and detail views

### Phase 2: Database Schema Extensions (Medium Priority)

1. Add missing fields to Problem model (ticketNumber, assignedTo, etc.)
2. Extend enums (ProblemStatus, ProblemPriority, ProblemCategory)
3. Run database migrations
4. Update repository layer to support new fields

### Phase 3: Enhanced Query Support (Medium Priority)

1. Extend ProblemRepository with admin search capabilities
2. Add filtering by assignedTo, category, escalation status
3. Implement date range filtering
4. Add advanced sorting options

### Phase 4: Admin-Specific Features (Low Priority)

1. Implement ticket assignment functionality
2. Add escalation workflows
3. Create bulk operations
4. Build analytics and reporting

### Phase 5: Performance & Optimization (Low Priority)

1. Add caching for admin queries
2. Optimize database indexes for admin searches
3. Implement background jobs for notifications
4. Add audit logging for admin actions

## Architecture Considerations

### Following Established Patterns

**User Service Pattern Compliance:**

- ✅ Dedicated admin controller separate from user controller
- ✅ Admin routes mounted at `/admin/{service}` prefix
- ✅ Same middleware stack: `requireAuth()` + `requireAdmin()`
- ✅ Reuse existing service layer with elevated permissions
- ✅ Type-safe request/response using admin API schemas

**Clean Architecture Maintenance:**

- ✅ Controllers handle HTTP concerns only
- ✅ Services contain business logic
- ✅ Repositories handle data access
- ✅ Mappers transform data between layers

### Security Considerations

**Admin Authentication:**

- All admin routes require authentication (`requireAuth()`)
- All admin routes require admin role (`requireAdmin()`)
- Schema validation for all requests
- Parameter validation for URL parameters

**Data Access Control:**

- Admins can access all tickets regardless of ownership
- Regular users can only access their own tickets
- Audit logging for admin actions (future enhancement)

## Current Infrastructure Ready

### ✅ Already Available

**API Documentation:**

- Admin schemas defined in `/packages/api/src/admin/schemas/support/`
- Schemas registered in admin API generator
- OpenAPI documentation auto-generated

**SDK Integration:**

- `getSupportTickets` method exists in admin SDK
- Proper TypeScript types generated
- Request/response interfaces defined

**Middleware & Authentication:**

- `requireAdmin()` middleware available
- Authentication infrastructure in place
- Validation middleware ready for use

**Database Infrastructure:**

- Base Problem model exists
- Comment system implemented
- Caching layer available
- Repository pattern established

## Conclusion

The Support service has a solid foundation but requires admin route implementation to match the comprehensive admin schemas and SDK expectations. The User service provides a clear implementation pattern to follow, ensuring consistency across the platform.

The primary blockers are:

1. Missing admin controller and routes
2. Database schema gaps for admin-specific fields
3. Enhanced query support for admin filtering

Once implemented, the Support service will provide full admin functionality matching the existing API contracts and SDK expectations.
