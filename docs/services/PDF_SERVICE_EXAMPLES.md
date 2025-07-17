# PDF Service Usage Examples

## API Usage Examples

### 1. Creating a Voucher Book (Admin)

```bash
POST /api/admin/pdf/voucher-books
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "title": "January 2024 Voucher Book",
  "edition": "January 2024",
  "bookType": "MONTHLY",
  "month": 1,
  "year": 2024,
  "totalPages": 24,
  "coverImageUrl": "https://storage.example.com/covers/jan-2024.jpg",
  "metadata": {
    "theme": "New Year Special",
    "region": "Central"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "January 2024 Voucher Book",
    "status": "DRAFT",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Adding Pages to a Book (Admin)

```bash
POST /api/admin/pdf/voucher-books/{bookId}/pages
Authorization: Bearer {admin-token}

{
  "pageNumber": 1,
  "layoutType": "STANDARD",
  "metadata": {
    "backgroundColor": "#FFFFFF"
  }
}
```

### 3. Placing Content on a Page (Admin)

```bash
POST /api/admin/pdf/pages/{pageId}/placements
Authorization: Bearer {admin-token}

{
  "contentType": "VOUCHER",
  "position": 1,
  "size": "QUARTER",
  "voucherId": "123e4567-e89b-12d3-a456-426614174000",
  "qrCodePayload": "eyJhbGciOiJIUzI1NiIs...",
  "shortCode": "JAN24-001",
  "title": "20% Off Premium Membership",
  "description": "Valid until January 31, 2024"
}
```

### 4. Publishing a Book (Admin)

```bash
POST /api/admin/pdf/voucher-books/{bookId}/publish
Authorization: Bearer {admin-token}

{
  "generatePdf": true
}
```

### 5. Creating a Distribution (Admin)

```bash
POST /api/admin/pdf/distributions
Authorization: Bearer {admin-token}

{
  "bookId": "550e8400-e29b-41d4-a716-446655440000",
  "businessId": "789e0123-e89b-12d3-a456-426614174000",
  "businessName": "McDonald's",
  "locationId": "456e7890-e89b-12d3-a456-426614174000",
  "locationName": "Downtown Branch",
  "quantity": 500,
  "distributionType": "initial",
  "contactName": "John Smith",
  "contactEmail": "john.smith@mcdonalds.com",
  "contactPhone": "+1234567890",
  "deliveryAddress": "123 Main St, Downtown, City 12345",
  "notes": "Please deliver to loading dock. Contact security on arrival."
}
```

### 6. Viewing Published Books (Public)

```bash
GET /api/pdf/voucher-books?year=2024&month=1&bookType=MONTHLY
```

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "January 2024 Voucher Book",
      "edition": "January 2024",
      "bookType": "MONTHLY",
      "year": 2024,
      "month": 1,
      "status": "PUBLISHED",
      "totalPages": 24,
      "publishedAt": "2024-01-15T14:00:00Z",
      "coverImageUrl": "https://storage.example.com/covers/jan-2024.jpg",
      "pdfUrl": "https://storage.example.com/pdfs/jan-2024-voucher-book.pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 7. Downloading a PDF (Public)

```bash
GET /api/pdf/voucher-books/{bookId}/download
```

**Response:**
```json
{
  "url": "https://storage.example.com/pdfs/jan-2024-voucher-book.pdf",
  "filename": "january-2024-voucher-book.pdf",
  "contentType": "application/pdf",
  "size": 15728640,
  "generatedAt": "2024-01-15T14:30:00Z"
}
```

## Code Usage Examples

### Repository Usage

```typescript
// Creating a voucher book
const voucherBook = await voucherBookRepository.create({
  title: "February 2024 Voucher Book",
  bookType: "MONTHLY",
  month: 2,
  year: 2024,
  totalPages: 24,
  createdBy: userId,
});

// Finding books with relations
const books = await voucherBookRepository.findAll({
  status: "PUBLISHED",
  year: 2024,
  parsedIncludes: { pages: true, distributions: true },
  page: 1,
  limit: 10,
});

// Creating a distribution
const distribution = await bookDistributionRepository.create({
  bookId: voucherBook.id,
  businessId: "business-uuid",
  businessName: "Burger King",
  quantity: 300,
  distributionType: "initial",
  contactName: "Jane Doe",
  contactEmail: "jane@burgerking.com",
  createdBy: userId,
});

// Updating distribution status
await bookDistributionRepository.markAsShipped(
  distributionId,
  "TRK123456789",
  "FedEx",
  userId
);
```

### Service Layer Usage

```typescript
// Service orchestration example
class VoucherBookService {
  async createMonthlyBook(data: CreateMonthlyBookInput) {
    // 1. Create the book
    const book = await this.bookRepository.create({
      ...data,
      status: "DRAFT",
    });

    // 2. Generate default pages
    for (let i = 1; i <= data.totalPages; i++) {
      await this.pageRepository.create({
        bookId: book.id,
        pageNumber: i,
        layoutType: i === 1 ? "COVER" : "STANDARD",
      });
    }

    // 3. Return complete book
    return this.bookRepository.findById(book.id, { pages: true });
  }

  async generatePdf(bookId: string, userId: string) {
    // 1. Get book with all relations
    const book = await this.bookRepository.findById(bookId, {
      pages: {
        placements: true,
      },
    });

    // 2. Validate book is ready
    if (book.status !== "READY_FOR_PRINT") {
      throw new Error("Book must be ready for print");
    }

    // 3. Generate PDF
    const pdfUrl = await this.pdfGenerator.generate(book);

    // 4. Update book with PDF URL
    return this.bookRepository.update(bookId, {
      pdfUrl,
      pdfGeneratedAt: new Date(),
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedBy: userId,
    });
  }
}
```

### Distribution Workflow

```typescript
// Complete distribution workflow
async function processDistribution(distributionId: string) {
  // 1. Get distribution
  const distribution = await distributionRepo.findById(distributionId);

  // 2. Validate business
  const business = await businessService.validate(distribution.businessId);

  // 3. Generate shipping label
  const tracking = await shippingService.createLabel({
    recipient: distribution.contactName,
    address: distribution.deliveryAddress,
    weight: distribution.quantity * 0.5, // 500g per book
  });

  // 4. Update distribution
  await distributionRepo.markAsShipped(
    distributionId,
    tracking.number,
    tracking.carrier,
    "system"
  );

  // 5. Send notification
  await notificationService.send({
    to: distribution.contactEmail,
    template: "distribution.shipped",
    data: {
      businessName: distribution.businessName,
      quantity: distribution.quantity,
      trackingNumber: tracking.number,
    },
  });
}
```

### Bulk Operations

```typescript
// Bulk publish multiple books
async function bulkPublishBooks(bookIds: string[], userId: string) {
  const results = await Promise.allSettled(
    bookIds.map(async (bookId) => {
      try {
        // Generate PDF
        await pdfService.generatePdf(bookId, userId);
        
        // Update status
        await bookRepository.updateStatus(bookId, "PUBLISHED", userId);
        
        return { bookId, success: true };
      } catch (error) {
        return { bookId, success: false, error: error.message };
      }
    })
  );

  return {
    successful: results.filter(r => r.status === "fulfilled").length,
    failed: results.filter(r => r.status === "rejected").length,
    results,
  };
}
```

## Common Patterns

### 1. Page Layout Validation

```typescript
function validatePlacement(
  page: VoucherBookPage,
  newPlacement: AdPlacementInput
): boolean {
  const existingPlacements = page.placements || [];
  
  // Check position conflicts
  const positionConflict = existingPlacements.some(
    p => p.position === newPlacement.position
  );
  
  if (positionConflict) return false;
  
  // Check space availability
  const usedSpaces = existingPlacements.reduce(
    (sum, p) => sum + p.spacesUsed,
    0
  );
  
  return usedSpaces + newPlacement.spacesUsed <= 8;
}
```

### 2. Distribution Statistics

```typescript
async function getDistributionInsights(bookId: string) {
  const stats = await distributionRepo.getDistributionStats(bookId);
  
  return {
    summary: {
      totalBooks: stats.totalQuantity,
      delivered: stats.quantityByStatus.delivered,
      inTransit: stats.quantityByStatus.shipped,
      pending: stats.quantityByStatus.pending,
    },
    deliveryRate: (stats.statusBreakdown.delivered / stats.totalDistributions) * 100,
    topBusinesses: Object.entries(stats.distributionsByBusiness)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([businessId, count]) => ({ businessId, count })),
  };
}
```

### 3. Error Handling

```typescript
// Comprehensive error handling for PDF generation
async function safePdfGeneration(bookId: string) {
  try {
    const result = await pdfService.generatePdf(bookId);
    return { success: true, result };
  } catch (error) {
    // Log error details
    logger.error("PDF generation failed", {
      bookId,
      error: error.message,
      stack: error.stack,
    });
    
    // Update book with error state
    await bookRepository.update(bookId, {
      metadata: {
        lastError: error.message,
        errorTimestamp: new Date(),
      },
    });
    
    // Notify admins
    await notificationService.notifyAdmins({
      type: "pdf.generation.failed",
      bookId,
      error: error.message,
    });
    
    return { success: false, error: error.message };
  }
}
```