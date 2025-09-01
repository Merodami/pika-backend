# 🚀 QR Code Direct Migration Plan

## Executive Summary

Direct migration plan from JWT-based to URL-based QR codes for VoucherBook. Since we're not in production, we can implement a clean architecture without backward compatibility overhead.

---

## 🎯 Migration Approach

### Why Direct Migration?

- **Not in production** = No existing users to migrate
- **Clean architecture** = No legacy code to maintain
- **Faster implementation** = No gradual rollout complexity
- **Better performance** = No dual-mode overhead

---

## 📋 Implementation Plan

### Phase 1: Database & Infrastructure (Days 1-3)

#### Database Changes

```sql
-- New validation codes table
CREATE TABLE voucher_validation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'scan', 'print', 'digital'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP,
  used_by UUID REFERENCES users(id)
);

-- Update VoucherScan for better analytics
ALTER TABLE voucher_scans
ADD COLUMN validation_code VARCHAR(20),
ADD COLUMN deep_link_mode VARCHAR(20), -- 'url', 'hybrid'
ADD COLUMN campaign VARCHAR(100);

-- Remove JWT-specific columns (clean migration)
ALTER TABLE voucher_codes
DROP COLUMN IF EXISTS jwt_payload;
```

#### Remove Legacy Infrastructure

- [ ] Remove ECDSA key pair generation
- [ ] Remove JWT signing logic
- [ ] Clean up VoucherSecurityService
- [ ] Delete unused crypto utilities

### Phase 2: Core Services (Days 4-7)

#### New Services

```typescript
// VoucherValidationService.ts (NEW)
class VoucherValidationService {
  async generateValidationCode(voucherId: string): Promise<string> {
    const code = generateSecureCode(8) // XXXX-XXXX format
    await this.repository.createValidationCode({
      voucherId,
      code,
      type: 'scan',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min for scans
    })
    return code
  }

  async validateAndRedeem(code: string, userId?: string): Promise<ValidationResult> {
    // Simple validation without JWT complexity
  }
}
```

#### Update Existing Services

```typescript
// VoucherDeepLinkService.ts (UPDATE)
class VoucherDeepLinkService {
  async generateQRPayload(voucherId: string, options?: QROptions): Promise<string> {
    const code = await this.validationService.generateValidationCode(voucherId)
    const baseUrl = 'https://app.thevoucherbook.com'

    // Hybrid mode for offline support
    if (options?.includeOfflineData) {
      const offlineData = await this.getVoucherEssentials(voucherId)
      return `${baseUrl}/v/${voucherId}?c=${code}&data=${encode(offlineData)}`
    }

    // Standard URL mode
    return `${baseUrl}/v/${voucherId}?c=${code}`
  }
}
```

### Phase 3: API Layer (Days 8-10)

#### New Endpoints (Simple & Clean)

```typescript
// POST /vouchers/:id/validate
router.post('/:id/validate', validateBody(ValidationRequest), controller.validateVoucher)

// GET /vouchers/:id/qr-code
router.get(
  '/:id/qr-code',
  requireAuth(),
  controller.generateQRCode, // Returns URL for QR generation
)
```

#### Simplified Redemption

```typescript
// POST /vouchers/:id/redeem (UPDATED - No JWT)
async redeemVoucher(req, res) {
  const { code, location } = req.body

  // Direct validation - no JWT parsing needed
  const result = await validationService.validateAndRedeem(
    code,
    req.user?.id,
    location
  )

  res.json(result)
}
```

### Phase 4: Repository Layer (Days 11-12)

#### Simplified Repository Methods

```typescript
class VoucherRepository {
  // Remove JWT-related methods
  // ❌ findByJWT()
  // ❌ validateJWTSignature()

  // Clean, simple methods
  async findByValidationCode(code: string): Promise<Voucher | null> {
    const validation = await this.prisma.voucherValidationCode.findUnique({
      where: { code, expiresAt: { gt: new Date() } },
      include: { voucher: true },
    })
    return validation?.voucher
  }
}
```

### Phase 5: Testing & Deployment (Days 13-15)

#### Testing Focus

- [ ] Unit tests for validation service
- [ ] Integration tests for QR flow
- [ ] Offline scanning tests (hybrid mode)
- [ ] Load testing validation endpoints
- [ ] Security testing (rate limiting, code expiry)

#### Deployment

- [ ] Deploy to development
- [ ] Mobile app integration testing
- [ ] Deploy to staging
- [ ] Final verification
- [ ] Production deployment

---

## 🔧 Technical Decisions

### QR Code Format

#### Standard Mode (Online)

```
https://app.thevoucherbook.com/v/{voucherId}?c={validationCode}
```

- Small QR code (50-80 chars)
- Server validates code
- Full voucher data fetched online

#### Hybrid Mode (Offline Support)

```
https://app.thevoucherbook.com/v/{voucherId}?c={code}&data={compressed_data}
```

- Larger QR code (200-300 chars)
- Contains essential voucher info
- Works offline, validates when online

### Validation Code Format

```
Format: XXXX-XXXX (8 chars alphanumeric)
Example: A7B3-M9K2
TTL: 5 minutes for scans, 1 year for prints
```

### Security Model

- **No cryptographic signatures** (server validates instead)
- **Rate limiting**: 10 attempts per minute per IP
- **Time-based expiry**: Codes expire quickly
- **Single use**: Codes marked as used after redemption

---

## 🗑️ What We're Removing

### Code to Delete

```
❌ /packages/crypto/src/ecdsa/
❌ /packages/crypto/src/qr/VoucherQRService.ts (JWT methods)
❌ VoucherSecurityService.generateVoucherTokens()
❌ VoucherSecurityService.verifyVoucherToken()
❌ All JWT validation logic
```

### Dependencies to Remove

```json
// package.json - Remove these
❌ "jsonwebtoken": "^9.0.0"
❌ "@noble/curves": "^1.2.0"
```

---

## 📊 Benefits of Direct Migration

### Development Speed

- **2 weeks** instead of 6 weeks
- No compatibility code to write
- No feature flags to manage
- No gradual rollout to monitor

### Code Quality

- Clean, modern architecture
- No legacy code paths
- Simpler testing (one path)
- Better maintainability

### Performance

- Smaller codebase
- No dual-mode checks
- Direct validation path
- Optimized for URL-based from start

---

## ✅ Implementation Checklist

### Week 1

- [ ] Database migrations created and tested
- [ ] Validation service implemented
- [ ] Deep link service updated
- [ ] JWT code removed
- [ ] Unit tests written

### Week 2

- [ ] API endpoints implemented
- [ ] Repository methods updated
- [ ] Integration tests complete
- [ ] Mobile app integration tested
- [ ] Documentation updated

### Week 3 (If needed for polish)

- [ ] Performance optimization
- [ ] Security audit
- [ ] Final testing
- [ ] Deployment to production

---

## 🎯 Success Criteria

- ✅ All QR codes are URL-based
- ✅ Offline scanning works via hybrid mode
- ✅ No JWT code remains in codebase
- ✅ Validation API responds in < 200ms
- ✅ Mobile app successfully scans and validates
- ✅ Zero legacy code or backward compatibility layers

---

## 🚨 Simplified Risk Management

Since we're not in production:

- **No data migration risk** (no existing QR codes)
- **No user impact** (no active users)
- **No rollback needed** (can fix forward)
- **Testing is simpler** (one flow to test)

---

_Last Updated: December 2024_
_Version: 1.0_
_Status: Ready for Implementation_
_Timeline: 2 weeks (vs 6 weeks for gradual migration)_
