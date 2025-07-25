# Enum Standardization Documentation

## Overview

This document tracks the migration of Prisma enum values from UPPERCASE to snake_case naming convention across the entire codebase.

## Migration Strategy

### Phase 1: User-Related Enums (CURRENT)
- `UserRole`: `ADMIN` → `admin`, `CUSTOMER` → `customer`, `BUSINESS` → `business`
- `UserStatus`: `ACTIVE` → `active`, `SUSPENDED` → `suspended`, `BANNED` → `banned`, `UNCONFIRMED` → `unconfirmed`

### Phase 2: Support System Enums (PENDING)
- `AuditAction`: `CREATE` → `create`, `UPDATE` → `update`, `DELETE` → `delete`, `LOGIN` → `login`, `LOGOUT` → `logout`, `STATUS_CHANGE` → `status_change`
- `ProblemStatus`: `OPEN` → `open`, `ASSIGNED` → `assigned`, `IN_PROGRESS` → `in_progress`, `WAITING_CUSTOMER` → `waiting_customer`, `WAITING_INTERNAL` → `waiting_internal`, `RESOLVED` → `resolved`, `CLOSED` → `closed`
- `ProblemPriority`: `LOW` → `low`, `MEDIUM` → `medium`, `HIGH` → `high`, `URGENT` → `urgent`, `CRITICAL` → `critical`
- `ProblemType`: `BILLING` → `billing`, `TECHNICAL` → `technical`, `ACCOUNT` → `account`, `GENERAL` → `general`, `BUG_REPORT` → `bug_report`, `FEATURE_REQUEST` → `feature_request`

### Phase 3: Communication Enums (PENDING)
- `NotificationStatus`: `PENDING` → `pending`, `SENT` → `sent`, `FAILED` → `failed`, `READ` → `read`
- `NotificationType`: `EMAIL` → `email`, `SMS` → `sms`, `PUSH` → `push`, `IN_APP` → `in_app`
- `CommunicationMethod`: `EMAIL` → `email`, `SMS` → `sms`, `PUSH` → `push`, `IN_APP` → `in_app`

### Phase 4: File System Enums (PENDING)
- `FileType`: `IMAGE` → `image`, `VIDEO` → `video`, `DOCUMENT` → `document`, `AUDIO` → `audio`, `OTHER` → `other`
- `StorageProvider`: `AWS_S3` → `aws_s3`, `LOCAL` → `local`, `MINIO` → `minio`

## Already Using snake_case (NO CHANGES NEEDED)
- `SubscriptionStatus`: `active`, `canceled`, `incomplete`, `incompleteExpired`, `pastDue`, `trialing`, `unpaid`
- `VoucherBookStatus`: `draft`, `ready_for_print`, `published`, `archived`
- `VoucherBookType`: `monthly`, `special_edition`, `regional`, `seasonal`, `promotional`
- `PageLayoutType`: `standard`, `mixed`, `full_page`, `custom`
- `AdSize`: `single`, `quarter`, `half`, `full`
- `ContentType`: `voucher`, `image`, `ad`, `sponsored`
- `VoucherState`: `draft`, `published`, `claimed`, `redeemed`, `expired`, `suspended`
- `VoucherType`: `percentage`, `fixed`
- `VoucherCodeType`: `qr`, `short`, `static`
- `VoucherScanType`: `customer`, `business`
- `VoucherScanSource`: `camera`, `gallery`, `link`, `share`
- `CustomerVoucherStatus`: `claimed`, `redeemed`, `expired`
- `FraudCaseStatus`: `pending`, `reviewing`, `approved`, `rejected`, `false_positive`

## Impact Analysis

### Breaking Changes Per Phase

#### Phase 1: User Service
**Files that need updates:**
- `packages/services/user/src/test/helpers/userTestHelpers.ts` ✅ (COMPLETED)
- `packages/services/user/src/test/integration/*.test.ts` (PENDING)
- `packages/services/user/src/controllers/UserController.ts` (PENDING)
- `packages/services/user/src/services/UserService.ts` (PENDING)
- `packages/services/user/src/repositories/UserRepository.ts` (PENDING)
- Any API schemas referencing user enums (PENDING)
- Any other services importing user enum types (PENDING)

#### Phase 2-4: Other Services
**Estimated impact:**
- Support service files
- Communication service files
- File management service files
- API schemas and validation
- Cross-service type imports
- Database migration required after each phase

## Migration Process

### For Each Phase:
1. **Documentation**: Update this file with planned changes
2. **Database Schema**: Update enum values in `packages/database/prisma/enums.prisma`
3. **Test Files**: Update all test helpers and test cases
4. **Service Implementation**: Update controllers, services, repositories
5. **API Schemas**: Update Zod schemas and OpenAPI definitions
6. **Cross-Service**: Update any services that import these enum types
7. **Database Migration**: Run `yarn db:generate` to update Prisma client
8. **Testing**: Run all affected tests to ensure no breakage
9. **Integration Testing**: Test cross-service communication

### Rollback Strategy
If issues arise, revert the specific enum changes in `enums.prisma` and run `yarn db:generate` to restore previous Prisma client types.

## Current Status

### ✅ Completed
- Phase 1 database schema updates for UserRole and UserStatus
- User test helpers updated to use snake_case

### 🚧 In Progress
- User service test files update
- User service implementation update

### ⏳ Pending
- Phase 2-4 enum migrations
- Cross-service impact analysis
- Database migration coordination

## Notes

- All voucher-related enums already use snake_case (implemented correctly from the start)
- Some enums have mixed conventions (e.g., NotificationStatus had `READ` in lowercase)
- Subscription enums use camelCase, which should be considered for future standardization
- Each phase should be completed and tested before moving to the next phase
- Consider creating a migration script to automate the process for future enum standardizations

## Implementation Recommendations

1. **Service-by-Service Approach**: Complete one service entirely before moving to the next
2. **Test-First**: Update test files before implementation files
3. **Database Last**: Update schema only after confirming all dependent code is ready
4. **Gradual Rollout**: Deploy each phase separately to production
5. **Monitoring**: Monitor for any runtime errors related to enum mismatches after each deployment