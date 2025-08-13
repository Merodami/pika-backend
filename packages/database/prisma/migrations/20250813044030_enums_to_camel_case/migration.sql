/*
  Warnings:

  - The values [status_change] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [full_page] on the enum `PageLayoutType` will be removed. If these variants are still used in the database, this will fail.
  - The values [aws_s3] on the enum `StorageProvider` will be removed. If these variants are still used in the database, this will fail.
  - The values [special_edition] on the enum `VoucherBookType` will be removed. If these variants are still used in the database, this will fail.
  - The values [incomplete_expired,past_due] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [false_positive] on the enum `FraudCaseStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [in_app] on the enum `CommunicationMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [in_app] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "audit"."AuditAction_new" AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'statusChange');
ALTER TABLE "audit"."audit_logs" ALTER COLUMN "action" TYPE "audit"."AuditAction_new" USING ("action"::text::"audit"."AuditAction_new");
ALTER TYPE "audit"."AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "audit"."AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "audit"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "files"."PageLayoutType_new" AS ENUM ('standard', 'mixed', 'fullPage', 'custom');
ALTER TABLE "files"."voucher_book_pages" ALTER COLUMN "layout_type" DROP DEFAULT;
ALTER TABLE "files"."voucher_book_pages" ALTER COLUMN "layout_type" TYPE "files"."PageLayoutType_new" USING ("layout_type"::text::"files"."PageLayoutType_new");
ALTER TYPE "files"."PageLayoutType" RENAME TO "PageLayoutType_old";
ALTER TYPE "files"."PageLayoutType_new" RENAME TO "PageLayoutType";
DROP TYPE "files"."PageLayoutType_old";
ALTER TABLE "files"."voucher_book_pages" ALTER COLUMN "layout_type" SET DEFAULT 'standard';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "files"."StorageProvider_new" AS ENUM ('awsS3', 'local', 'minio');
ALTER TYPE "files"."StorageProvider" RENAME TO "StorageProvider_old";
ALTER TYPE "files"."StorageProvider_new" RENAME TO "StorageProvider";
DROP TYPE "files"."StorageProvider_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "files"."VoucherBookType_new" AS ENUM ('monthly', 'specialEdition', 'regional', 'seasonal', 'promotional');
ALTER TABLE "files"."voucher_books" ALTER COLUMN "book_type" DROP DEFAULT;
ALTER TABLE "files"."voucher_books" ALTER COLUMN "book_type" TYPE "files"."VoucherBookType_new" USING ("book_type"::text::"files"."VoucherBookType_new");
ALTER TYPE "files"."VoucherBookType" RENAME TO "VoucherBookType_old";
ALTER TYPE "files"."VoucherBookType_new" RENAME TO "VoucherBookType";
DROP TYPE "files"."VoucherBookType_old";
ALTER TABLE "files"."voucher_books" ALTER COLUMN "book_type" SET DEFAULT 'monthly';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "payments"."SubscriptionStatus_new" AS ENUM ('active', 'canceled', 'incomplete', 'incompleteExpired', 'pastDue', 'trialing', 'unpaid');
ALTER TABLE "payments"."subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments"."subscriptions" ALTER COLUMN "status" TYPE "payments"."SubscriptionStatus_new" USING ("status"::text::"payments"."SubscriptionStatus_new");
ALTER TYPE "payments"."SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "payments"."SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "payments"."SubscriptionStatus_old";
ALTER TABLE "payments"."subscriptions" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "security"."FraudCaseStatus_new" AS ENUM ('pending', 'reviewing', 'approved', 'rejected', 'falsePositive');
ALTER TABLE "security"."fraud_cases" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "security"."fraud_cases" ALTER COLUMN "status" TYPE "security"."FraudCaseStatus_new" USING ("status"::text::"security"."FraudCaseStatus_new");
ALTER TYPE "security"."FraudCaseStatus" RENAME TO "FraudCaseStatus_old";
ALTER TYPE "security"."FraudCaseStatus_new" RENAME TO "FraudCaseStatus";
DROP TYPE "security"."FraudCaseStatus_old";
ALTER TABLE "security"."fraud_cases" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."CommunicationMethod_new" AS ENUM ('email', 'sms', 'push', 'inApp');
ALTER TYPE "support"."CommunicationMethod" RENAME TO "CommunicationMethod_old";
ALTER TYPE "support"."CommunicationMethod_new" RENAME TO "CommunicationMethod";
DROP TYPE "support"."CommunicationMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."NotificationType_new" AS ENUM ('email', 'sms', 'push', 'inApp');
ALTER TYPE "support"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "support"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "support"."NotificationType_old";
COMMIT;
