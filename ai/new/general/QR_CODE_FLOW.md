# QR Code Flow Documentation

## Overview

This document describes the complete QR code lifecycle in the Pika voucher platform, from generation to redemption, including both customer and business scanning scenarios.

## Table of Contents

1. [QR Code Generation](#qr-code-generation)
2. [QR Code Types](#qr-code-types)
3. [Scanning Flows](#scanning-flows)
4. [Security Considerations](#security-considerations)
5. [Implementation Status](#implementation-status)
6. [Future Enhancements](#future-enhancements)

## QR Code Generation

When a voucher is created, the system generates multiple code types for different use cases:

### 1. Standard QR Code (JWT)

**Generated in**: `/src/write/infrastructure/utils/codeGenerator.ts`

```typescript
{
  type: 'voucher',
  vid: 'voucher-uuid',    // Voucher ID
  iat: 1234567890,        // Issued at timestamp
  exp: 1234567890         // Expiration (365 days)
}
```

**Characteristics**:

- Signed with VOUCHER_JWT_PRIVATE_KEY
- Long-lived (365 days) - actual voucher expiration is checked separately
- Contains minimal data to keep QR code simple
- Can be scanned multiple times

### 2. Short Code (Human-Readable)

**Format**: 8 alphanumeric characters (e.g., `SAVE2024`)

**Purpose**:

- Fallback for damaged QR codes
- Manual entry option
- Phone-based redemption

### 3. Static Code (Print Campaigns)

**Format**: Fixed codes like `COFFEE10`

**Purpose**:

- Mass-printed voucher books
- Shared promotional codes
- No user association required

## QR Code Types

The platform supports different QR code types based on the voucher distribution method:

### User-Specific QR Codes (Future Enhancement)

```typescript
{
  vid: 'voucher-uuid',
  uid: 'user-uuid',      // User who claimed the voucher
  typ: 'user',
  exp: 300               // 5-minute TTL for security
}
```

### Print Campaign QR Codes

```typescript
{
  vid: 'voucher-uuid',
  typ: 'print',
  btc: 'BATCH2024',      // Batch code for tracking
  lmt: 1000,             // Redemption limit
  exp: 2592000           // 30 days
}
```

## Scanning Flows

### Customer Scanning (Flutter App)

**Current Status**: ⚠️ Not yet implemented

**Intended Flow**:

1. Customer opens Flutter app
2. Scans voucher QR code
3. App decodes JWT and extracts voucher ID
4. App calls: `GET /api/v1/vouchers/{voucherId}/details`
5. Voucher details displayed to customer
6. Customer can:
   - View terms and conditions
   - See expiration date
   - Add to "My Vouchers" (claim)
   - Share with friends
   - Get directions to business

**Metrics Tracked**:

- Scan timestamp
- Customer location (if permitted)
- Device type
- Scan source (camera, gallery, shared link)

### Business Scanning (Redemption)

**Current Status**: ✅ Implemented with Inter-Service Communication

**Flow**:

1. Business owner opens redemption interface
2. Scans customer's QR code
3. System calls: `POST /api/v1/redemptions`
4. Redemption service:
   - Validates JWT signature
   - Checks voucher validity
   - Verifies business authorization
   - Records redemption
   - Calls Voucher service to update state (CLAIMED → REDEEMED)
5. Voucher service:
   - Validates state transition
   - Updates voucher state
   - Increments redemption count
   - Returns updated voucher

**Validation Steps**:

```typescript
// In RedeemVoucherCommandHandler
1. Decode QR/short code
2. Fetch voucher details
3. Validate:
   - Voucher state === 'PUBLISHED'
   - Current date < expiration date
   - Business ID matches voucher retailer
   - Customer hasn't exceeded redemption limit
   - Total redemptions < voucher limit
4. Record redemption
5. Update metrics
```

## Security Considerations

### Multiple Scans

**Customer Scans**:

- ✅ Can scan unlimited times
- ✅ Each scan tracked for analytics
- ✅ No consumption of voucher
- ⚠️ Rate limiting recommended (not implemented)

**Business Scans**:

- ✅ First valid scan redeems the voucher
- ✅ Subsequent scans show "already redeemed" message
- ✅ Tracks redemption attempts for fraud detection
- ✅ Provider validation ensures only authorized businesses can redeem

### JWT Security

1. **Signature Verification**: All QR codes are cryptographically signed
2. **Expiration**: JWTs have expiration dates (separate from voucher expiration)
3. **Minimal Data**: QR codes contain only essential data to prevent information leakage
4. **One-Time Redemption**: Redemptions are tracked to prevent reuse

### Offline Capability

For areas with poor connectivity:

1. QR codes can be validated offline using public key cryptography
2. Redemptions are stored locally and synced when connection restored
3. Short codes provide fallback for QR scanning issues

## Implementation Status

### ✅ Implemented

1. **QR Code Generation**
   - JWT-based QR codes with voucher ID
   - Short code generation
   - Static code support

2. **Business Redemption**
   - QR code validation
   - Redemption tracking
   - Provider authorization
   - Offline support
   - Inter-service state updates (Redemption → Voucher)

3. **Security**
   - JWT signatures
   - Expiration checking
   - One-time redemption
4. **Inter-Service Communication**
   - Redemption service updates voucher state via authenticated service calls
   - State transitions enforced in voucher service (CLAIMED → REDEEMED)
   - Service authentication using x-api-key headers
   - Automatic redemption count tracking

### ❌ Not Implemented

1. **Customer Scanning**
   - Scan tracking endpoint
   - Voucher details endpoint
   - "Add to wallet" functionality
   - Scan analytics

2. **Voucher Claiming**
   - Customer-voucher association
   - "My Vouchers" list
   - Claim before redeem flow

3. **Analytics**
   - Scan-to-redemption conversion
   - Geographic heat maps
   - Time-based patterns

## Future Enhancements

### 1. Customer Scan Endpoint

```typescript
// GET /vouchers/{voucherId}/scan
{
  "voucher": { /* voucher details */ },
  "scanId": "scan-uuid",
  "canClaim": true,
  "nearbyLocations": [ /* business locations */ ]
}
```

### 2. Voucher Claiming System

```typescript
// POST /vouchers/{voucherId}/claim
{
  "claimId": "claim-uuid",
  "expiresAt": "2024-12-31",
  "walletPosition": 1
}
```

### 3. Enhanced Analytics

```typescript
// GET /vouchers/{voucherId}/analytics
{
  "totalScans": 1523,
  "uniqueUsers": 892,
  "claimRate": 0.65,
  "redemptionRate": 0.45,
  "averageTimeToRedeem": "3.5 days"
}
```

### 4. Dynamic QR Codes

- Generate user-specific QR codes after claiming
- Shorter TTL for better security
- Include user context for personalized redemption

### 5. QR Code Variations

- Different QR designs for campaigns
- Embed business logo in QR code
- A/B testing different QR formats

## Database Schema Requirements

### Existing Tables

```prisma
model Voucher {
  id            String
  // ... existing fields
  scanCount     Int @default(0)     // Total scans
  claimCount    Int @default(0)     // Total claims
  impressions   Int @default(0)     // View count
}

model VoucherCode {
  id         String
  voucherId  String
  code       String
  type       String  // QR, SHORT, STATIC
  // ... existing fields
}
```

### Proposed New Tables

```prisma
model VoucherScan {
  id          String   @id
  voucherId   String
  userId      String?  // Null for anonymous scans
  scanType    String   // CUSTOMER, BUSINESS
  scanSource  String   // CAMERA, GALLERY, LINK
  deviceInfo  Json
  location    Json?
  createdAt   DateTime

  @@index([voucherId, scanType])
  @@index([userId])
}

model CustomerVoucher {
  id          String   @id
  customerId  String
  voucherId   String
  claimedAt   DateTime
  status      String   // CLAIMED, REDEEMED, EXPIRED
  walletOrder Int      // Display order in wallet

  @@unique([customerId, voucherId])
  @@index([customerId, status])
}

model RedemptionAttempt {
  id            String   @id
  voucherId     String
  businessId    String
  attemptedAt   DateTime
  successful    Boolean
  failureReason String?
  deviceInfo    Json

  @@index([voucherId])
  @@index([businessId])
}
```

## API Endpoints Summary

### Current Endpoints

```
POST   /api/v1/vouchers              - Create voucher (with QR)
GET    /api/v1/vouchers/{id}         - Get voucher details
POST   /api/v1/redemptions           - Redeem voucher (business)
POST   /api/v1/redemptions/validate  - Validate offline redemption
```

### Proposed Endpoints

```
GET    /api/v1/vouchers/{id}/scan    - Track customer scan
POST   /api/v1/vouchers/{id}/claim   - Claim to wallet
GET    /api/v1/customers/vouchers    - List claimed vouchers
GET    /api/v1/vouchers/{id}/analytics - Scan analytics
DELETE /api/v1/customers/vouchers/{id} - Remove from wallet
```

## Testing QR Codes

### Generate Test QR

```bash
# Using the crypto package
node -e "
const { VoucherQRService } = require('@pika/crypto');
const qr = new VoucherQRService({
  algorithm: 'ES256',
  issuer: 'test',
  audience: 'test'
});
// Generate QR payload
"
```

### Validate QR

```bash
# Decode JWT
echo "YOUR_QR_JWT" | jwt decode -
```

### Test Flows

1. **Customer Scan Test**:
   - Generate QR code
   - Scan with Flutter app
   - Verify metrics recorded
   - Check voucher appears in wallet

2. **Business Redemption Test**:
   - Create claimed voucher
   - Generate redemption QR
   - Scan with business app
   - Verify redemption recorded
   - Check duplicate scan rejected

## Monitoring and Alerts

### Key Metrics to Track

1. **Scan Metrics**:
   - Scans per hour/day
   - Unique users scanning
   - Scan-to-claim conversion
   - Claim-to-redemption conversion

2. **Security Metrics**:
   - Failed validation attempts
   - Duplicate redemption attempts
   - Expired token scans
   - Geographic anomalies

3. **Performance Metrics**:
   - QR generation time
   - Validation latency
   - Offline sync delays

### Recommended Alerts

1. **High Failed Validations**: Could indicate fraud attempt
2. **Unusual Scan Patterns**: Spike in scans from single IP/device
3. **Low Conversion Rates**: Marketing campaign issues
4. **Sync Failures**: Offline redemptions not syncing

## Conclusion

The QR code system is the bridge between digital vouchers and physical redemption. While the current implementation handles business redemption well, adding customer scanning and claiming features will complete the user journey and provide valuable analytics for both businesses and the platform.
