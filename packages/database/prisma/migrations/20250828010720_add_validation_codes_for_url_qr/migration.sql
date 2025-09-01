-- CreateEnum
CREATE TYPE "voucher"."VoucherValidationCodeType" AS ENUM ('scan', 'print', 'digital');

-- AlterTable
ALTER TABLE "analytics"."voucher_scans" ADD COLUMN     "campaign" VARCHAR(100),
ADD COLUMN     "deep_link_mode" VARCHAR(20),
ADD COLUMN     "validation_code" VARCHAR(20);

-- CreateTable
CREATE TABLE "voucher"."voucher_validation_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "type" "voucher"."VoucherValidationCodeType" NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "used_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_validation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_validation_codes_code_key" ON "voucher"."voucher_validation_codes"("code");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_code_idx" ON "voucher"."voucher_validation_codes"("code");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_voucher_id_idx" ON "voucher"."voucher_validation_codes"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_expires_at_idx" ON "voucher"."voucher_validation_codes"("expires_at");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_voucher_id_expires_at_idx" ON "voucher"."voucher_validation_codes"("voucher_id", "expires_at");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_type_idx" ON "voucher"."voucher_validation_codes"("type");

-- AddForeignKey
ALTER TABLE "voucher"."voucher_validation_codes" ADD CONSTRAINT "voucher_validation_codes_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher"."voucher_validation_codes" ADD CONSTRAINT "voucher_validation_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
