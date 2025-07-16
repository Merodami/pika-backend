/*
  Warnings:

  - The `status` column on the `gyms` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "gyms"."GymStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'COMING_SOON');

-- AlterTable
ALTER TABLE "gyms"."gyms" DROP COLUMN "status",
ADD COLUMN     "status" "gyms"."GymStatus" NOT NULL DEFAULT 'COMING_SOON';
