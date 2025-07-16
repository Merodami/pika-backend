/*
  Warnings:

  - Added the required column `city` to the `gyms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `gyms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_id` to the `gyms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `gyms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postal_code` to the `gyms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `gyms` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "gyms"."GymVerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "gyms"."GymTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "gyms"."GymSubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "gyms"."gyms" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bank_account_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "business_registration_number" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'UK',
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "last_inspection_date" DATE,
ADD COLUMN     "owner_id" UUID NOT NULL,
ADD COLUMN     "phone_number" TEXT NOT NULL,
ADD COLUMN     "postal_code" TEXT NOT NULL,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "risk_score" INTEGER,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "subscription_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "subscription_status" "gyms"."GymSubscriptionStatus",
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "tier" "gyms"."GymTier" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "verification_status" "gyms"."GymVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verified_at" TIMESTAMPTZ(6),
ADD COLUMN     "verified_by" UUID,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "gyms"."gym_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "gym_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."gym_trainers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "gym_trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."gym_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gym_members_gym_id_user_id_key" ON "gyms"."gym_members"("gym_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gym_trainers_gym_id_user_id_key" ON "gyms"."gym_trainers"("gym_id", "user_id");

-- AddForeignKey
ALTER TABLE "gyms"."gyms" ADD CONSTRAINT "gyms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gyms" ADD CONSTRAINT "gyms_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_members" ADD CONSTRAINT "gym_members_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_members" ADD CONSTRAINT "gym_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_trainers" ADD CONSTRAINT "gym_trainers_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_trainers" ADD CONSTRAINT "gym_trainers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_reviews" ADD CONSTRAINT "gym_reviews_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_reviews" ADD CONSTRAINT "gym_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
