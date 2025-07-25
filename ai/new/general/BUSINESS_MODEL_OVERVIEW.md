# Pika Business Model Overview

## Core Concept

Pika is a hybrid physical-digital voucher platform that bridges traditional coupon books with modern mobile technology, similar to Groupon but with a unique physical distribution component.

## Revenue Streams

### 1. Physical Voucher Book Advertising

- **Product**: Monthly printed voucher books (24 pages, A5 format)
- **Book Structure**: A5 format that folds in half with front and back covers
- **Content Types**:
  - **VOUCHER**: Business vouchers with QR codes
  - **IMAGE**: Static promotional images
  - **AD**: Advertisement content
  - **SPONSORED**: Premium sponsored content
- **Space Allocation**:
  - **Full Page**: 8 spaces (entire page)
  - **Half Page**: 4 spaces
  - **Quarter Page**: 2 spaces
  - **Single Space**: 1 space (up to 8 per page)
- **Distribution**: Physical distribution in Asunción, Paraguay
- **Revenue**: Businesses pay for content placement in the monthly book

### 2. Digital Platform

- **Marketplace**: Groupon-like digital voucher marketplace
- **Premium Placement**: Featured spots in the app
- **Analytics**: Detailed metrics for businesses
- **Subscription Tiers**: Different levels of features for businesses

## Platform Components

### 1. Physical Voucher Books

```
┌─────────────────────────┐
│     Page Layout         │
├─────────────┬───────────┤
│   Ad 1 (2)  │  Ad 2 (2) │  ← Quarter page each
├─────────────┼───────────┤
│      Ad 3 (4 spaces)    │  ← Half page
├──────┬──────┬──────┬────┤
│ Ad 4 │ Ad 5 │ Ad 6 │ Ad7│  ← Single spaces
└──────┴──────┴──────┴────┘
```

Each ad contains:

- Custom business image/logo
- Business information
- Discount percentage
- QR code
- Short code (fallback)

### 2. Flutter Mobile App (Customer-facing)

- **Browse**: Discover vouchers by category, location, popularity
- **Search**: Find specific businesses or offers
- **Scan**: QR code scanner for physical voucher books
- **Save**: Bookmark favorite vouchers
- **Redeem**: Show voucher at business for discount
- **Reviews**: Rate businesses and vouchers
- **Notifications**: Expiration reminders, new offers
- **Maps**: Find nearby participating businesses

### 3. Business Dashboard

- **Ad Designer**: Create voucher advertisements
- **Campaign Management**: Set up and monitor promotions
- **Analytics**: Track scans, redemptions, ROI
- **Customer Insights**: Demographics, behavior patterns
- **Budget Control**: Manage ad spending
- **Reviews Management**: Respond to customer feedback

### 4. Admin Dashboard

- **Page Layout Designer**: Arrange ads on voucher book pages
- **PDF Generation**: Create print-ready voucher books
- **Business Management**: Approve/reject businesses
- **Revenue Tracking**: Monitor ad sales and subscriptions
- **App Configuration**: Manage categories, featured content
- **Fraud Detection**: Monitor suspicious redemption patterns
- **Distribution Tracking**: Monitor physical book distribution

## User Journeys

### Customer Journey

1. **Discovery**:
   - Receive physical voucher book
   - OR browse offers in mobile app
2. **Evaluation**:
   - View voucher details
   - Check business location/hours
   - Read reviews
3. **Claiming**:
   - Scan QR from physical book
   - OR claim from digital marketplace
4. **Redemption**:
   - Show voucher at business
   - Business scans to validate
   - Enjoy discount

### Business Journey

1. **Onboarding**:
   - Sign up on platform
   - Verify business details
   - Choose advertising package
2. **Campaign Creation**:
   - Design voucher ad
   - Set discount parameters
   - Define redemption limits
3. **Publishing**:
   - Ad placed in physical book
   - Voucher live in app
4. **Monitoring**:
   - Track scan metrics
   - Monitor redemptions
   - Analyze ROI
5. **Optimization**:
   - Adjust offers based on data
   - Respond to reviews
   - Plan next campaigns

## Technical Architecture Alignment

### Services Mapping

- **Voucher Service**: Core voucher management
- **Redemption Service**: High-performance redemption processing
- **Category Service**: Business categorization
- **User Service**: Customer and business accounts
- **PDF Generator Service**: Voucher book creation
- **Notification Service**: Customer engagement
- **Review Service**: Ratings and feedback

### Key Features Implementation

#### 1. Voucher Book Page Management

```typescript
interface VoucherBookPage {
  pageNumber: number
  month: string
  year: number
  adPlacements: AdPlacement[]
}

interface AdPlacement {
  position: number // 1-8
  size: AdSize // SINGLE, QUARTER, HALF, FULL
  businessId: string
  voucherId: string
  designUrl: string
  qrCode: string
  shortCode: string
}

enum AdSize {
  SINGLE = 1, // 1 space
  QUARTER = 2, // 2 spaces
  HALF = 4, // 4 spaces
  FULL = 8, // 8 spaces
}
```

#### 2. Business Subscription Tiers

```typescript
interface BusinessSubscription {
  tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  features: {
    monthlyVouchers: number
    analyticsDepth: 'BASIC' | 'DETAILED' | 'ADVANCED'
    adSizes: AdSize[]
    digitalPlacement: boolean
    customDesigns: boolean
    apiAccess: boolean
  }
  pricing: {
    monthly: number
    adSpacePrice: Record<AdSize, number>
  }
}
```

#### 3. Analytics Tracking

```typescript
interface VoucherAnalytics {
  // Physical book metrics
  bookPrintRun: number
  booksDistributed: number

  // Digital metrics
  impressions: number
  scans: number
  claims: number
  redemptions: number

  // Conversion funnel
  scanToClaimRate: number
  claimToRedemptionRate: number
  averageTimeToRedeem: string

  // Geographic data
  scanHeatmap: GeoPoint[]
  redemptionLocations: Location[]

  // Customer insights
  demographics: Demographics
  repeatCustomerRate: number
}
```

## Monetization Strategy

### Direct Revenue

1. **Ad Space Sales**: Monthly fees for voucher book placement
2. **Premium Features**: Advanced analytics, priority placement
3. **Transaction Fees**: Percentage of high-value vouchers
4. **Subscription Plans**: Monthly/annual business subscriptions

### Indirect Revenue

1. **Data Insights**: Anonymized market trends (with consent)
2. **Sponsored Categories**: Featured business categories
3. **Partnership Programs**: Integration with POS systems
4. **White Label**: Offer platform to other regions

## Digital Wallet Feature

### Overview

The digital wallet transforms the user experience from "use it or lose it" to "save and organize" mentality, increasing engagement and redemption rates.

### Wallet Functionality

- **Save for Later**: Claim vouchers without immediate redemption
- **Organization**: Reorder vouchers by preference or expiration
- **Tracking**: Monitor savings potential and expiration dates
- **History**: View past redemptions and total savings
- **Sharing**: Send vouchers to family members

### Wallet States

```typescript
interface CustomerWallet {
  activeVouchers: ClaimedVoucher[] // Currently valid
  expiringVouchers: ClaimedVoucher[] // Expiring in 7 days
  redeemedVouchers: RedeemedVoucher[] // History
  totalPotentialSavings: number // Sum of discounts
  lifetimeSavings: number // Actual money saved
}

interface ClaimedVoucher {
  voucherId: string
  claimedAt: Date
  expiresAt: Date
  walletPosition: number // User's sort order
  notifyBeforeExpiry: boolean
  status: 'CLAIMED' | 'REDEEMED' | 'EXPIRED'
}
```

### Business Benefits

- **Higher Engagement**: Users check wallet regularly
- **Better Analytics**: Track claim-to-redemption funnel
- **Reduced Friction**: No need to decide immediately
- **Family Sharing**: Increases viral spread

## Market Differentiation

### vs. Groupon

- **Physical Component**: Printed books reach non-digital users
- **Local Focus**: Deep integration with local businesses
- **Lower Barrier**: No internet required for basic usage
- **Predictable Costs**: Fixed monthly ad rates

### vs. Traditional Coupon Books

- **Digital Tracking**: Complete analytics pipeline
- **Dynamic Updates**: Change offers without reprinting
- **Customer Insights**: Know who uses vouchers
- **Fraud Prevention**: Digital validation prevents copying

## Success Metrics

### Business KPIs

- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (CLV)
- Churn Rate

### Platform Metrics

- Active Businesses
- Active Customers
- Vouchers Redeemed/Month
- App Downloads
- Daily Active Users (DAU)
- Wallet Adoption Rate
- Average Vouchers per Wallet
- Claim-to-Redemption Rate

### Operational Metrics

- Books Printed/Distributed
- Ad Space Utilization
- Redemption Fraud Rate
- Customer Support Tickets

## Implementation Priorities

### Phase 1: MVP (3 months)

- Basic voucher creation/redemption
- Simple Flutter app
- Manual PDF generation
- Core analytics

### Phase 2: Growth (6 months)

- Automated page layout
- Business self-service
- Advanced analytics
- Review system

### Phase 3: Scale (12 months)

- AI-powered recommendations
- Multi-city expansion
- API marketplace
- White label offering

## Conclusion

Pika combines the trust and reach of physical coupon books with the convenience and analytics of digital platforms, creating a unique value proposition for both local businesses and consumers in emerging markets where smartphone adoption is growing but physical media still plays an important role.
