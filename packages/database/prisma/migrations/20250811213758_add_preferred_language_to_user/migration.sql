/*
  Warnings:

  - You are about to drop the column `interval` on the `subscription_plans` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payments"."subscription_plans_interval_idx";

-- AlterTable
ALTER TABLE "payments"."subscription_plans" DROP COLUMN "interval";

-- AlterTable
ALTER TABLE "users"."users" ADD COLUMN     "preferred_language" VARCHAR(2);
