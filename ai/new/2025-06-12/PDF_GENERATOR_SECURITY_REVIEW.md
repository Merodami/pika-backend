# PDF Generator Service - Security & RequestContext Review

## Critical Security Issues Found

### 1. Missing RequestContext Implementation

The PDF Generator service does NOT implement the `RequestContext` pattern used throughout the rest of the codebase.

**Current Implementation (INSECURE):**

```typescript
// PDFController.ts
const userId = request.headers['x-user-id'] as string // Direct header access
```

**Expected Implementation:**

```typescript
// Should use RequestContext
const context = RequestContext.fromHeaders(request)
const result = await handler.execute(dto, context)
```

### 2. Missing Ownership Fields in Database

The `VoucherBook` model has NO user/provider ownership fields:

```prisma
model VoucherBook {
  id         String  @id
  title      String
  // NO userId field
  // NO providerId field
  // NO createdBy field
}
```

This means:

- ❌ No ownership tracking
- ❌ No access control
- ❌ No audit trail
- ❌ Any authenticated user can modify ANY voucher book

### 3. Missing Authorization Checks

The service performs NO authorization checks:

```typescript
// Current: No role validation
async create(request: FastifyRequest, reply: FastifyReply) {
  const dto = request.body as VoucherBookCreateDTO
  const voucherBook = await this.createHandler.execute(dto)  // No context!
}

// Should validate roles
async create(request: FastifyRequest, reply: FastifyReply) {
  const context = RequestContext.fromHeaders(request)

  // Only admins and providers should create books
  if (!RequestContext.isAdmin(context) && !RequestContext.isProvider(context)) {
    throw ErrorFactory.forbidden('Only admins and providers can create voucher books')
  }

  const voucherBook = await this.createHandler.execute(dto, context)
}
```

### 4. Command Handlers Don't Accept Context

None of the command handlers accept `UserContext`:

```typescript
// Current
async execute(dto: VoucherBookCreateDTO): Promise<VoucherBook>

// Should be
async execute(dto: VoucherBookCreateDTO, context: UserContext): Promise<VoucherBook>
```

## Security Vulnerabilities

1. **Unauthorized Access**: Any authenticated user can:
   - Create voucher books
   - Update ANY voucher book
   - Delete ANY voucher book
   - Generate PDFs for ANY book

2. **No Audit Trail**: System doesn't track:
   - Who created each book
   - Who modified it
   - When changes were made

3. **Provider Isolation Violation**: Providers can:
   - Access other providers' books
   - Modify competitors' content
   - Delete other providers' books

## Required Changes

### 1. Update Database Schema

```prisma
model VoucherBook {
  // ... existing fields ...
  createdBy    String?  @map("created_by") @db.Uuid
  providerId   String?  @map("provider_id") @db.Uuid

  // Relations
  createdByUser User?     @relation(fields: [createdBy], references: [id])
  provider      Provider?  @relation(fields: [providerId], references: [id])
}
```

### 2. Implement RequestContext in Controllers

```typescript
import { RequestContext } from '@pika/http'

async create(request: FastifyRequest, reply: FastifyReply) {
  const context = RequestContext.fromHeaders(request)
  const dto = request.body as VoucherBookCreateDTO

  const voucherBook = await this.createHandler.execute(dto, context)
  // ...
}
```

### 3. Update Command Handlers

```typescript
export class CreateVoucherBookCommandHandler {
  async execute(dto: VoucherBookCreateDTO, context: UserContext): Promise<VoucherBook> {
    // Validate permissions
    if (!RequestContext.isAdmin(context) && !RequestContext.isProvider(context)) {
      throw new NotAuthorizedError('Insufficient permissions')
    }

    // Set ownership
    const bookData = {
      ...dto,
      createdBy: context.userId,
      providerId: RequestContext.isProvider(context) ? context.userId : undefined,
    }

    return this.repository.createVoucherBook(bookData)
  }
}
```

### 4. Add Authorization Checks

For update/delete operations:

```typescript
async execute(bookId: string, dto: VoucherBookUpdateDTO, context: UserContext): Promise<VoucherBook> {
  const book = await this.repository.getVoucherBook(bookId)

  // Check ownership
  if (!RequestContext.isAdmin(context)) {
    if (book.createdBy !== context.userId && book.providerId !== context.userId) {
      throw new NotAuthorizedError('You do not own this voucher book')
    }
  }

  // Proceed with update...
}
```

## Impact Assessment

- **High Risk**: Current implementation allows any user to manipulate any voucher book
- **Data Integrity**: No way to track book ownership or changes
- **Business Impact**: Providers could interfere with competitors' campaigns
- **Compliance**: No audit trail for regulatory requirements

## Recommendation

This is a **CRITICAL** security issue that should be fixed before production deployment. The PDF Generator service must implement the same RequestContext pattern and authorization checks used throughout the rest of the codebase.
