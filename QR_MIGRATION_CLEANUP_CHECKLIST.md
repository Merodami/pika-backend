# 🧹 QR Migration Cleanup Checklist

## Overview

This document tracks all legacy JWT-based QR code components that need to be removed after the migration to URL-based QR codes is complete.

---

## 📝 Code to Remove After Migration

### 1. Repository Methods

**File:** `/packages/services/voucher/src/repositories/VoucherRepository.ts`

- [ ] `findByQRCode()` method - Lines ~399-419
- [ ] Remove QR code check from `findByAnyCode()` - Lines 510-512
- [ ] Update comments in `findByAnyCode()` to remove legacy references

### 2. VoucherSecurityService (Entire Service)

**File:** `/packages/services/voucher/src/services/VoucherSecurityService.ts`

- [ ] **ENTIRE FILE** - This service handles JWT generation for QR codes
- [ ] Remove all ECDSA key pair generation
- [ ] Remove JWT token generation methods
- [ ] Remove token verification methods

### 3. Crypto Package Components

**Files in** `/packages/crypto/`

- [ ] `/src/qr/VoucherQRService.ts` - JWT-based QR generation
- [ ] `/src/ecdsa/` - Entire directory for ECDSA operations
- [ ] `/src/utils/keyGeneration.ts` - Key generation utilities
- [ ] Update `/src/index.ts` to remove exports

### 4. Database Schema

**Files:**

- [ ] Remove `qrCode` field from Voucher model
- [ ] Remove VoucherCode table's `QR` type enum value
- [ ] Clean up VoucherCodeType enum - mark `qr` as deprecated

### 5. Environment Variables

**File:** `/packages/environment/src/constants/`

- [ ] `VOUCHER_JWT_ALGORITHM`
- [ ] `VOUCHER_JWT_PRIVATE_KEY`
- [ ] `VOUCHER_JWT_PUBLIC_KEY`
- [ ] `QR_CODE_DEFAULT_MODE` (if not using hybrid)
- [ ] Any JWT-related voucher configs

**TO ADD - New Environment Variables for Validation Codes:**

- [ ] Add `VALIDATION_CODE_TTL_SCAN` (default: 300 seconds / 5 min)
- [ ] Add `VALIDATION_CODE_TTL_PRINT` (default: 31536000 seconds / 1 year)
- [ ] Add `VALIDATION_CODE_TTL_DIGITAL` (default: 86400 seconds / 24 hours)
- [ ] Add `VALIDATION_RATE_LIMIT_MAX` (default: 10 attempts)
- [ ] Add `VALIDATION_RATE_LIMIT_TTL` (default: 60 seconds)

### 6. Service Imports and Dependencies

**Various service files:**

- [ ] Remove imports of `VoucherSecurityService`
- [ ] Remove imports of `ECDSAService`
- [ ] Remove imports of `VoucherQRService` from crypto package
- [ ] Remove `keyManager` imports

### 7. Package Dependencies

**File:** `package.json`

- [ ] Remove `jsonwebtoken` dependency
- [ ] Remove `@noble/curves` dependency (if only used for vouchers)
- [ ] Remove any other JWT/crypto libraries not used elsewhere

### 8. API Endpoints (If Any)

**Check for:**

- [ ] Any endpoints that generate JWT QR codes directly
- [ ] Any endpoints that validate JWT tokens
- [ ] Update documentation to remove JWT references

### 9. Tests

**Test files to update/remove:**

- [ ] `/packages/crypto/src/test/integration/voucher-crypto-flow.integration.test.ts`
- [ ] Any unit tests for JWT QR generation
- [ ] Any integration tests relying on JWT validation

### 10. Documentation

**Documentation to update:**

- [ ] Remove JWT QR code references from API docs
- [ ] Update voucher scanning documentation
- [ ] Remove ECDSA/JWT setup instructions

---

## 🎯 Migration Verification Steps

Before removing legacy code, ensure:

1. **All QR codes are URL-based**
   - [ ] No new JWT QR codes being generated
   - [ ] All existing vouchers have validation codes

2. **Mobile app updated**
   - [ ] Flutter app handles URL-based QR codes
   - [ ] No dependencies on JWT validation

3. **Testing complete**
   - [ ] All voucher flows work with URL-based codes
   - [ ] No references to JWT in logs

4. **Monitoring shows no JWT usage**
   - [ ] No JWT validation attempts in logs
   - [ ] No errors related to missing JWT keys

---

## 🗓️ Timeline

### Phase 1: Current Implementation ✅

- Validation code table created
- VoucherValidationService implemented
- Repository methods added
- URL-based QR generation ready

### Phase 2: Testing & Verification (1 week)

- Test all flows with URL-based codes
- Update mobile app
- Monitor for issues

### Phase 3: Cleanup (After verification)

- Remove all items in this checklist
- Clean up unused imports
- Remove unused dependencies
- Update documentation

---

## 🔍 Search Commands for Cleanup

Use these commands to find legacy code:

```bash
# Find JWT-related voucher code
grep -r "generateQRToken\|VoucherQRService\|ECDSAService" packages/

# Find JWT imports
grep -r "import.*jsonwebtoken\|import.*@noble/curves" packages/

# Find ECDSA references
grep -r "ECDSA\|keyPair\|privateKey.*voucher" packages/

# Find QR code type references
grep -r "VoucherCodeType.QR\|type.*qr" packages/
```

---

## ⚠️ Important Notes

1. **DO NOT remove** until URL-based QR is fully tested and deployed
2. **Keep backup** of removed code in a separate branch initially
3. **Monitor logs** for any JWT validation attempts after removal
4. **Update tests** before removing code to ensure coverage

---

_Last Updated: December 2024_
_Status: Ready for Phase 2 (Testing & Verification)_

Modified files: modified:

    modified:   .env.local
    modified:   .env.test
    deleted:    BUSINESS_REGISTRATION_VALIDATION_REPORT.md
    new file:   DEEP_LINKING_QR_STRATEGY.md
    new file:   DOMAINS.md
    new file:   FLUTTER_QR_COMPLETE_ROADMAP.md
    new file:   FLUTTER_QR_IMPLEMENTATION_PLAN.md
    renamed:    documentation/implementation/backend/QR_CODE_DEEP_LINKING_ARCHITECTURE.md -> QR_CODE_DEEP_LINKING_ARCHITECTURE.md
    renamed:    documentation/implementation/backend/QR_CODE_DIRECT_MIGRATION_PLAN.md -> QR_CODE_DIRECT_MIGRATION_PLAN.md
    new file:   QR_MIGRATION_CLEANUP_CHECKLIST.md
    new file:   QR_SCAN_USER_FLOWS.md
    new file:   REPORT_ANALYTICS_PLAN.md
    new file:   documentation/business/COMPREHENSIVE_VOUCHER_FLOWS.md
    new file:   documentation/business/VOUCHER_FLOWS_COMPREHENSIVE.md
    new file:   documentation/business/VOUCHER_FLOWS_VISUAL.md
    deleted:    documentation/implementation/backend/QR_MIGRATION_CLEANUP_CHECKLIST.md
    modified:   generated/flutter/schemas/voucher_voucher_VoucherRedeemRequest.json
    modified:   generated/flutter/schemas/voucher_voucher_VoucherScanRequest.json
    modified:   generated/flutter/schemas/voucher_voucher_combined.json
    modified:   package.json
    modified:   packages/api-gateway/src/api/server.ts
    modified:   packages/api-gateway/src/docs/openapi/admin-api.json
    modified:   packages/api-gateway/src/docs/openapi/all-apis.json
    modified:   packages/api-gateway/src/docs/openapi/internal-api.json
    modified:   packages/api-gateway/src/docs/openapi/public-api.json
    modified:   packages/api/src/schemas/admin/reports.ts
    modified:   packages/api/src/schemas/shared/analytics.ts
    modified:   packages/api/src/schemas/voucher/common/enums.ts
    modified:   packages/api/src/schemas/voucher/public/index.ts
    new file:   packages/api/src/schemas/voucher/public/validation.ts
    modified:   packages/api/src/schemas/voucher/public/voucher.ts
    modified:   packages/auth/src/test/integration/services/JwtTokenService.redis.test.ts
    modified:   packages/auth/src/test/integration/strategies/LocalAuthStrategy.test.ts
    modified:   packages/auth/src/test/unit/services/JwtTokenService.test.ts
    deleted:    packages/crypto/src/qr/VoucherQRService.ts
    modified:   packages/crypto/src/qr/index.ts
    deleted:    packages/crypto/src/test/integration/voucher-crypto-flow.integration.test.ts
    modified:   packages/database/prisma/enums.prisma
    new file:   packages/database/prisma/migrations/20250828010720_add_validation_codes_for_url_qr/migration.sql
    new file:   packages/database/prisma/migrations/20250828183355_add_metadata_to_voucher_scan/migration.sql
    modified:   packages/database/prisma/models/user.prisma
    modified:   packages/database/prisma/models/voucher.prisma
    new file:   packages/environment/src/constants/deepLinks.ts
    modified:   packages/environment/src/constants/index.ts
    modified:   packages/environment/src/constants/service.ts
    modified:   packages/http/src/infrastructure/express/middleware/auth.ts
    modified:   packages/redis/src/domain/repositories/ICacheService.ts
    modified:   packages/redis/src/infrastructure/services/memory.ts
    modified:   packages/redis/src/infrastructure/services/redis.ts
    modified:   packages/sdk/src/dto/voucher.dto.ts
    modified:   packages/sdk/src/mappers/VoucherMapper.ts
    modified:   packages/services/auth/src/test/integration/cache-validation.test.ts
    modified:   packages/services/business/src/test/integration/business.admin.integration.test.ts
    modified:   packages/services/business/src/test/integration/business.internal.integration.test.ts
    modified:   packages/services/business/src/test/integration/business.public.integration.test.ts
    modified:   packages/services/business/src/test/integration/business.registration.integration.test.ts
    modified:   packages/services/business/src/test/integration/cache-validation.test.ts
    modified:   packages/services/category/src/test/integration/admin/category.admin.test.ts
    modified:   packages/services/category/src/test/integration/cache-validation.test.ts
    modified:   packages/services/category/src/test/integration/internal/category.internal.test.ts
    modified:   packages/services/category/src/test/integration/public/category.public.test.ts
    modified:   packages/services/communication/src/test/integration/communication.admin.integration.test.ts
    modified:   packages/services/communication/src/test/integration/communication.internal.integration.test.ts
    modified:   packages/services/communication/src/test/integration/communication.public.integration.test.ts
    modified:   packages/services/payment/src/test/integration/stripe-mock.integration.test.ts
    modified:   packages/services/pdf/test/integration/admin.pdf.integration.test.ts
    modified:   packages/services/pdf/test/integration/pdf.integration.test.ts
    modified:   packages/services/storage/src/test/integration/e2e/storage-minio.integration.test.ts
    modified:   packages/services/storage/src/test/integration/e2e/storage-s3.integration.test.ts
    modified:   packages/services/storage/src/test/integration/e2e/storage.integration.test.ts
    modified:   packages/services/support/src/test/integration/e2e/admin.support.integration.test.ts
    modified:   packages/services/support/src/test/integration/e2e/support.integration.test.ts
    modified:   packages/services/voucher/src/constants/cache-keys.ts
    modified:   packages/services/voucher/src/controllers/VoucherController.ts
    new file:   packages/services/voucher/src/controllers/VoucherValidationController.ts
    modified:   packages/services/voucher/src/repositories/InternalVoucherRepository.ts
    modified:   packages/services/voucher/src/repositories/VoucherRepository.ts
    new file:   packages/services/voucher/src/repositories/VoucherValidationRepository.ts
    modified:   packages/services/voucher/src/routes/InternalVoucherRoutes.ts
    modified:   packages/services/voucher/src/routes/VoucherRoutes.ts
    new file:   packages/services/voucher/src/routes/VoucherValidationRoutes.ts
    modified:   packages/services/voucher/src/server.ts
    modified:   packages/services/voucher/src/services/InternalVoucherService.ts
    new file:   packages/services/voucher/src/services/VoucherDeepLinkService.ts
    new file:   packages/services/voucher/src/services/VoucherDeepLinkValidationService.ts
    deleted:    packages/services/voucher/src/services/VoucherSecurityService.ts
    modified:   packages/services/voucher/src/services/VoucherService.ts
    new file:   packages/services/voucher/src/services/VoucherValidationService.ts
    modified:   packages/services/voucher/src/test/helpers/voucherTestHelpers.ts
    modified:   packages/services/voucher/src/test/integration/redemption-analytics.admin.integration.test.ts
    new file:   packages/services/voucher/src/test/integration/voucher-validation.integration.test.ts
    modified:   packages/services/voucher/src/test/integration/voucher.admin.integration.test.ts
    modified:   packages/services/voucher/src/types/domain.ts
    modified:   packages/services/voucher/src/types/index.ts
    new file:   packages/services/voucher/src/types/validation.ts
    modified:   packages/services/voucher/src/utils/codeGenerator.ts
    modified:   packages/tests/src/mocks/cacheServiceMock.ts
    modified:   packages/tests/src/utils/dump/init.sql
    modified:   packages/types/src/enum.ts
    modified:   packages/types/src/enums/voucher.ts
    modified:   packages/types/src/utils.ts
    new file:   scripts/flows/test-qr-validation-flow.ts
    modified:   scripts/flows/voucher-creation-flow.ts
    new file:   scripts/test-qr-validation-flow.ts
    new file:   test-tokens-local.json
    modified:   yarn.lock
