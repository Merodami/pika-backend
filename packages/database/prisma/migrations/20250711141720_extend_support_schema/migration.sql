/*
  Warnings:

  - A unique constraint covering the columns `[ticket_number]` on the table `problems` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "support"."ProblemType" AS ENUM ('BILLING', 'TECHNICAL', 'ACCOUNT', 'BOOKING', 'GYM_ISSUE', 'TRAINER_ISSUE', 'GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST');

-- AlterEnum
ALTER TYPE "support"."ProblemPriority" ADD VALUE 'CRITICAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "support"."ProblemStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "support"."ProblemStatus" ADD VALUE 'WAITING_CUSTOMER';
ALTER TYPE "support"."ProblemStatus" ADD VALUE 'WAITING_INTERNAL';

-- AlterTable
ALTER TABLE "support"."problems" ADD COLUMN     "assigned_to" UUID,
ADD COLUMN     "files" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ticket_number" VARCHAR(20),
ADD COLUMN     "type" "support"."ProblemType" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE UNIQUE INDEX "problems_ticket_number_key" ON "support"."problems"("ticket_number");

-- CreateIndex
CREATE INDEX "problems_type_idx" ON "support"."problems"("type");

-- CreateIndex
CREATE INDEX "problems_assigned_to_idx" ON "support"."problems"("assigned_to");

-- CreateIndex
CREATE INDEX "problems_ticket_number_idx" ON "support"."problems"("ticket_number");

-- AddForeignKey
ALTER TABLE "support"."problems" ADD CONSTRAINT "problems_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
