/*
  Warnings:

  - The values [ready_for_print] on the enum `VoucherBookStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [in_progress,waiting_customer,waiting_internal] on the enum `ProblemStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [bug_report,feature_request] on the enum `ProblemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "files"."VoucherBookStatus_new" AS ENUM ('draft', 'readyForPrint', 'published', 'archived');
ALTER TABLE "files"."voucher_books" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "files"."voucher_books" ALTER COLUMN "status" TYPE "files"."VoucherBookStatus_new" USING ("status"::text::"files"."VoucherBookStatus_new");
ALTER TYPE "files"."VoucherBookStatus" RENAME TO "VoucherBookStatus_old";
ALTER TYPE "files"."VoucherBookStatus_new" RENAME TO "VoucherBookStatus";
DROP TYPE "files"."VoucherBookStatus_old";
ALTER TABLE "files"."voucher_books" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."ProblemStatus_new" AS ENUM ('open', 'assigned', 'inProgress', 'waitingCustomer', 'waitingInternal', 'resolved', 'closed');
ALTER TABLE "support"."problems" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "support"."problems" ALTER COLUMN "status" TYPE "support"."ProblemStatus_new" USING ("status"::text::"support"."ProblemStatus_new");
ALTER TYPE "support"."ProblemStatus" RENAME TO "ProblemStatus_old";
ALTER TYPE "support"."ProblemStatus_new" RENAME TO "ProblemStatus";
DROP TYPE "support"."ProblemStatus_old";
ALTER TABLE "support"."problems" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."ProblemType_new" AS ENUM ('billing', 'technical', 'account', 'general', 'bugReport', 'featureRequest');
ALTER TABLE "support"."problems" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "support"."problems" ALTER COLUMN "type" TYPE "support"."ProblemType_new" USING ("type"::text::"support"."ProblemType_new");
ALTER TYPE "support"."ProblemType" RENAME TO "ProblemType_old";
ALTER TYPE "support"."ProblemType_new" RENAME TO "ProblemType";
DROP TYPE "support"."ProblemType_old";
ALTER TABLE "support"."problems" ALTER COLUMN "type" SET DEFAULT 'general';
COMMIT;
