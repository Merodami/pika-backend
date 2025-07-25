# Future Development Guide

## Overview

This document consolidates all planned features, architectural decisions, and implementation strategies for the Pika voucher platform. These features are designed but not yet implemented.

## 1. Customer Wallet System

### Purpose

Allow customers to save vouchers for later use rather than immediate redemption.

### User Flow

1. Customer discovers vouchers (browse app or scan physical book)
2. **Claims** vouchers they're interested in → Saved to digital wallet
3. Views "My Vouchers" list anytime
4. When ready, shows voucher at business for redemption
5. Business scans to complete redemption

### Benefits

- Save multiple vouchers for convenient use later
- Track expiration dates with notifications
- View voucher history
- Share vouchers with family/friends
- No need to carry physical books
- Organize vouchers by preference

### Current State

- `ClaimVoucherCommandHandler` already tracks:
  - `walletPosition` - Display order in wallet
  - `notifyExpiry` - Expiration reminders preference
- Missing: Database table and retrieval endpoints

### Required Implementation

```prisma
model CustomerVoucher {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  customerId      String   @map("customer_id") @db.Uuid
  voucherId       String   @map("voucher_id") @db.Uuid
  claimedAt       DateTime @map("claimed_at") @db.Timestamptz(6)
  status          String   // CLAIMED, REDEEMED, EXPIRED
  walletPosition  Int      @map("wallet_position")
  notifyExpiry    Boolean  @default(true) @map("notify_expiry")

  @@unique([customerId, voucherId])
  @@map("customer_vouchers")
  @@schema("marketplace")
}
```

## 2. Scan Tracking System

### Purpose

Track all QR code scans for analytics and user engagement metrics.

### Types of Scans

1. **Customer Scans**: View voucher details, decide to claim
2. **Business Scans**: Validate and redeem vouchers

### Current State

- `VoucherScanRouter.ts` exists with endpoints
- `VoucherScanCommandHandler` exists but only logs
- No database table for persistence

### Required Implementation

- Add `VoucherScan` table for tracking
- Update handler to persist scan data
- Create analytics aggregation queries
- Track: location, device type, scan source (camera/gallery/link)

## 3. Physical Voucher Book System

### Business Model

- Monthly printed books with 24 pages
- 8 ad spaces per page (can be combined)
- Businesses pay for ad placement
- Physical distribution + digital tracking

### Ad Size Options

- **Full Page**: 8 spaces
- **Half Page**: 4 spaces
- **Quarter Page**: 2 spaces
- **Single Space**: 1 space

### Required Components

1. **Database Tables**: VoucherBook, VoucherBookPage, AdPlacement
2. **PDF Generator Service**: Create print-ready books
3. **Admin Interface**: Arrange ads on pages
4. **Distribution Tracking**: Monitor physical delivery

### Revenue Model

- Direct ad sales for book placement
- Tiered pricing based on ad size
- Premium placement fees (cover, back)

## 4. Review System

### Purpose

Enable customer feedback on vouchers and businesses.

### Features

- Rate vouchers (1-5 stars)
- Written reviews
- Business responses
- Review aggregation for ratings

### Current State

- Review table exists in database schema
- No service implementation (planned for port 5005)

## 5. PDF Generator Service

### Purpose

Create print-ready voucher books for physical distribution.

### Requirements

- Generate 24-page PDFs
- Embed QR codes and short codes
- Support various ad layouts
- High-resolution print output
- Batch generation for monthly books

### Technology Options

- Start simple: HTML-to-PDF
- Later: Puppeteer for complex layouts
- Consider: PDFKit for programmatic generation

## 6. Business Subscription Tiers

### Tiers

```typescript
BASIC (Free):
- 1 voucher/month
- Basic analytics
- Digital marketplace only

PREMIUM (50,000 PYG/month):
- 5 vouchers/month
- Detailed analytics
- 20% discount on print ads
- Priority support

ENTERPRISE (Custom):
- Unlimited vouchers
- Advanced analytics
- API access
- Custom integrations
```

## 7. Enhanced Analytics

### Metrics to Track

- Scan-to-claim conversion rate
- Claim-to-redemption conversion rate
- Geographic heat maps
- Time-based patterns
- Customer demographics
- Repeat customer rate
- Average time to redemption

### Implementation

- Add tracking fields to Voucher model
- Create aggregation queries
- Build analytics dashboard API
- Real-time metrics updates

## 8. Offline-First Features

### Customer App

- Cache claimed vouchers locally
- Queue actions when offline
- Sync when connection restored
- Show QR codes without internet

### Business App

- Download daily voucher whitelist
- Validate QR codes offline using cryptography
- Queue redemptions locally
- Batch sync when online

## 9. Fraud Prevention

### Patterns to Detect

- Photocopied vouchers (multiple scans from distant locations)
- Excessive scanning rates
- Geographic impossibilities
- Unusual redemption patterns

### Implementation

- ✅ **Idempotency**: System-wide middleware prevents double processing
- Rate limiting per device
- Location validation
- Pattern analysis
- Risk scoring system

### Already Implemented

- **Idempotency Middleware**: Prevents duplicate redemptions via X-Idempotency-Key headers
- **Inter-Service Communication**: Redemption service updates voucher state to REDEEMED
- **JWT Validation**: Cryptographic verification of QR codes

## 10. Multi-Language Support

### Current Support

- Spanish (es)
- English (en)
- Guaraní (gn)
- Portuguese (pt)

### Implementation Notes

- All voucher content stored as JSON
- Language detection based on user preference
- Fallback chain: User pref → Device → Location → Default (es)

## Implementation Roadmap

### Phase 1: Core Completion (Weeks 1-2)

- Fix redemption flow
- Add scan tracking
- Complete wallet system

### Phase 2: Monetization (Weeks 3-4)

- Basic PDF generation
- Manual voucher book creation
- Ad placement system

### Phase 3: Engagement (Weeks 5-6)

- Review system
- Enhanced analytics
- Notification system

### Phase 4: Scale (Weeks 7-8)

- Offline support
- Fraud detection
- Performance optimization

## Technical Debt Items

### Database

- Add missing indexes for geo queries
- Optimize voucher search queries
- Implement soft deletes consistently

### Testing

- Integration tests for full flows
- Load testing for scale
- Flutter widget tests

### Security

- API rate limiting
- Enhanced JWT validation
- Audit logging

## Development Guidelines

### Code Patterns

- Follow existing DDD/CQRS structure
- Use dependency injection
- Implement idempotency for mutations
- Add comprehensive error handling

### Database Migrations

```bash
# After schema changes
yarn db:generate
yarn db:migrate
yarn generate:types
```

### Testing Strategy

- Unit tests for business logic
- Integration tests with real database
- E2E tests for critical paths
- Performance benchmarks

## Success Metrics

### Technical

- <1s redemption processing
- 99.9% uptime
- <100ms QR validation

### Business

- 10+ active businesses
- 1000+ app downloads
- 50+ redemptions/week
- First book printed

### User

- 4.5+ app store rating
- <2% fraud rate
- 70% scan-to-claim rate

## Notes

- Keep MVP simple, iterate based on usage
- Prioritize reliability over features
- Design for Paraguay's infrastructure
- Consider cultural preferences
- Plan for offline scenarios

This guide will be updated as development progresses and new insights emerge.
