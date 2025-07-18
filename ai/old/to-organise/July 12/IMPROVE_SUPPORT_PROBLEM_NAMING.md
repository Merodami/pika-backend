# Support Service: Problem → SupportTicket Naming Improvement

## Overview

This document outlines the comprehensive refactoring to rename "Problem" to "SupportTicket" throughout the support service codebase for better clarity and professional naming.

## Current State Analysis

### Database Schema

- **Current table name**: `problem`
- **Current model name**: `Problem`
- **Related table**: `support_comment` (already well-named)

### Code Structure

```
Current naming:
- Model: Problem, ProblemDomain
- Repository: ProblemRepository, IProblemRepository
- Service: ProblemService, IProblemService
- Controller: ProblemController, AdminProblemController
- Routes: ProblemRoutes, AdminProblemRoutes
- Mappers: ProblemMapper
- Types: ProblemStatus, ProblemPriority, ProblemType
- API Schemas: CreateProblemRequest, UpdateProblemRequest, etc.
```

### Impact Analysis

1. **Database Level**
   - Table rename: `problem` → `support_ticket`
   - Foreign key updates in `support_comment` table
   - Existing data preservation required

2. **Code Level**
   - ~50+ files need updates
   - All imports and exports
   - Type definitions and interfaces
   - API schema definitions

3. **API Level**
   - Endpoint paths remain mostly the same
   - Request/Response schema names change
   - Documentation updates needed

## Execution Plan

### Phase 1: Preparation

1. Create this documentation
2. Identify all files that need changes
3. Plan the migration strategy

### Phase 2: Database Schema Changes

1. Update Prisma schema files:
   - Rename model `Problem` → `SupportTicket`
   - Update `@@map("support_ticket")`
   - Update enum names
2. Generate migration script
3. Update foreign key references

### Phase 3: Code Refactoring

1. **Domain/SDK Layer**
   - Rename ProblemDomain → SupportTicketDomain
   - Update ProblemMapper → SupportTicketMapper

2. **Repository Layer**
   - ProblemRepository → SupportTicketRepository
   - Update all method signatures

3. **Service Layer**
   - ProblemService → SupportTicketService
   - Update all references

4. **Controller Layer**
   - ProblemController → SupportTicketController
   - AdminProblemController → AdminSupportTicketController

5. **Routes Layer**
   - Update route file names
   - Update route paths if needed

6. **API Schemas**
   - Update all schema names
   - Update schema descriptions

7. **Types and Enums**
   - ProblemStatus → TicketStatus (already exists!)
   - ProblemPriority → TicketPriority (already exists!)
   - ProblemType → TicketType (already exists!)

### Phase 4: Testing

1. Update all test files
2. Run migrations on test database
3. Execute all tests
4. Fix any failing tests

### Phase 5: Documentation

1. Update API documentation
2. Update any README files
3. Update comments in code

## Benefits

1. **Clarity**: "SupportTicket" immediately conveys purpose
2. **Consistency**: Aligns with industry standards
3. **Professionalism**: Better customer-facing terminology
4. **Context**: Database table name includes service context
5. **Future-proof**: Clear distinction from other potential ticket types

## Risks and Mitigation

1. **Risk**: Breaking existing integrations
   - **Mitigation**: Keep API endpoints the same, only change internal naming

2. **Risk**: Migration failures
   - **Mitigation**: Test migration thoroughly, keep rollback plan

3. **Risk**: Missed references causing runtime errors
   - **Mitigation**: Use TypeScript compiler to catch all issues

## Implementation Status

- [ ] Phase 1: Preparation ✓
- [ ] Phase 2: Database Schema Changes
- [ ] Phase 3: Code Refactoring
- [ ] Phase 4: Testing
- [ ] Phase 5: Documentation

---

## Detailed File Changes Log

### Files to be modified:

(This section will be updated as changes are made)
