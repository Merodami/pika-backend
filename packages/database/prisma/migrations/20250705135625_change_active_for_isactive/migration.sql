/*
  Warnings:

  - You are about to drop the column `active` on the `stuff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "gyms"."stuff" DROP COLUMN "active",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
