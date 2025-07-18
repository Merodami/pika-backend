# QR Code Architecture Summary

## Overview

The Pika platform uses QR codes as the primary mechanism for voucher distribution and redemption. This document provides a high-level overview of the QR code architecture.

## Key Components

### 1. QR Code Generation (Voucher Service)

- **Technology**: JWT tokens with ECDSA signatures
- **Payload**: Minimal data (voucher ID) to keep QR codes scannable
- **Alternatives**: Short codes for manual entry, static codes for print

### 2. QR Code Types

| Type           | Use Case         | TTL       | Security         |
| -------------- | ---------------- | --------- | ---------------- |
| Standard       | Digital vouchers | 365 days  | JWT signed       |
| User-specific  | Claimed vouchers | 5 minutes | User ID included |
| Print campaign | Voucher books    | 30 days   | Batch tracking   |

### 3. Scanning Flows

#### Customer Scanning (View & Claim)

```
Customer → Scan QR → Decode JWT → Fetch Details → Display → Claim to Wallet
```

#### Business Scanning (Redemption)

```
Business → Scan QR → Validate → Check Limits → Record Redemption → Update Status
```

### 4. Security Model

- **JWT Signatures**: Prevent tampering
- **Short TTL**: Minimize exposure window for user vouchers
- **One-time Use**: Redemptions tracked in database
- **Offline Validation**: Public key cryptography for no-network scenarios

## Current Implementation Status

### ✅ Complete

- QR code generation with JWT (@pika/crypto package)
- Business redemption flow (RedemptionService)
- Offline validation support
- Short code fallback
- VoucherScanRouter.ts endpoint structure
- Inter-service communication (Redemption → Voucher state updates)
- System-wide idempotency middleware for preventing double redemptions

### 🚧 Partially Implemented

- Customer scan tracking (API exists, database tables missing)
- Voucher claiming system (ClaimVoucherCommandHandler exists)

### ❌ Not Started

- VoucherScan database table
- CustomerVoucher database table
- Scan analytics aggregation
- QR code customization (logos, colors)
- A/B testing different formats
- Fraud detection system

## Integration with Crypto Package

The voucher service integrates with `@pika/crypto` for:

- JWT generation and validation
- QR payload optimization
- Batch code generation
- Security utilities

## API Endpoints

### Current

- `POST /vouchers` - Creates voucher with QR
- `POST /redemptions` - Redeems via QR/short code

### Proposed

- `POST /vouchers/:id/scan` - Track customer scan
- `POST /vouchers/:id/claim` - Claim to wallet
- `GET /vouchers/:id/analytics` - Scan metrics

## Performance Considerations

1. **QR Complexity**: Keep payloads small for fast scanning
2. **Caching**: Cache voucher details for quick lookups
3. **Batch Operations**: Support bulk QR generation for campaigns
4. **Rate Limiting**: Prevent scan abuse

## Future Enhancements

1. **Dynamic QR Codes**: Generate unique codes per user after claiming
2. **QR Templates**: Customizable designs for different campaigns
3. **Advanced Analytics**: Heat maps, conversion funnels, A/B testing
4. **Fraud Detection**: ML-based anomaly detection for scan patterns

## Related Documentation

- [QR_CODE_FLOW.md](./QR_CODE_FLOW.md) - Detailed flow documentation
- [VOUCHER_BOOK_ARCHITECTURE.md](./VOUCHER_BOOK_ARCHITECTURE.md) - Physical book integration
- [MVP_IMPROVEMENTS.md](./MVP_IMPROVEMENTS.md) - Enhancement roadmap
- [@pika/crypto README](../../crypto/README.md) - Crypto package documentation

## Note on Documentation Status

This document describes both implemented and planned features. Features marked as "Not Started" represent the intended architecture but require database migrations and additional development work.
