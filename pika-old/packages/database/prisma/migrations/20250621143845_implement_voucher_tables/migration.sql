-- CreateEnum
CREATE TYPE "marketplace"."VoucherScanType" AS ENUM ('CUSTOMER', 'BUSINESS');

-- CreateEnum
CREATE TYPE "marketplace"."VoucherScanSource" AS ENUM ('CAMERA', 'GALLERY', 'LINK', 'SHARE');

-- CreateEnum
CREATE TYPE "marketplace"."CustomerVoucherStatus" AS ENUM ('CLAIMED', 'REDEEMED', 'EXPIRED');

-- AlterTable
ALTER TABLE "marketplace"."vouchers" ADD COLUMN     "claim_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scan_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "marketplace"."voucher_scans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "user_id" UUID,
    "scan_type" "marketplace"."VoucherScanType" NOT NULL,
    "scan_source" "marketplace"."VoucherScanSource" NOT NULL,
    "location" geography(Point, 4326),
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "scanned_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."customer_vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "claimed_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "marketplace"."CustomerVoucherStatus" NOT NULL DEFAULT 'CLAIMED',
    "notification_preferences" JSONB,
    "redeemed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voucher_scans_voucher_id_idx" ON "marketplace"."voucher_scans"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_scans_user_id_idx" ON "marketplace"."voucher_scans"("user_id");

-- CreateIndex
CREATE INDEX "voucher_scans_scan_type_idx" ON "marketplace"."voucher_scans"("scan_type");

-- CreateIndex
CREATE INDEX "voucher_scans_scanned_at_idx" ON "marketplace"."voucher_scans"("scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_location_idx" ON "marketplace"."voucher_scans" USING GIST ("location");

-- CreateIndex
CREATE INDEX "customer_vouchers_customer_id_idx" ON "marketplace"."customer_vouchers"("customer_id");

-- CreateIndex
CREATE INDEX "customer_vouchers_voucher_id_idx" ON "marketplace"."customer_vouchers"("voucher_id");

-- CreateIndex
CREATE INDEX "customer_vouchers_status_idx" ON "marketplace"."customer_vouchers"("status");

-- CreateIndex
CREATE INDEX "customer_vouchers_claimed_at_idx" ON "marketplace"."customer_vouchers"("claimed_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_vouchers_customer_id_voucher_id_key" ON "marketplace"."customer_vouchers"("customer_id", "voucher_id");

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_scans" ADD CONSTRAINT "voucher_scans_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_scans" ADD CONSTRAINT "voucher_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."customer_vouchers" ADD CONSTRAINT "customer_vouchers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."customer_vouchers" ADD CONSTRAINT "customer_vouchers_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
