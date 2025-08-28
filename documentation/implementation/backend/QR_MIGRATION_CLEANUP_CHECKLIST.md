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

*Last Updated: December 2024*
*Status: Ready for Phase 2 (Testing & Verification)*