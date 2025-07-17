-- CreateEnum
CREATE TYPE "marketplace"."ContentType" AS ENUM ('VOUCHER', 'IMAGE', 'AD', 'SPONSORED');

-- DropForeignKey
ALTER TABLE "marketplace"."ad_placements" DROP CONSTRAINT "ad_placements_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "marketplace"."ad_placements" DROP CONSTRAINT "ad_placements_voucher_id_fkey";

-- AlterTable
ALTER TABLE "marketplace"."ad_placements" ADD COLUMN     "content_type" "marketplace"."ContentType" NOT NULL DEFAULT 'VOUCHER',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "spaces_used" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "title" VARCHAR(255),
ALTER COLUMN "voucher_id" DROP NOT NULL,
ALTER COLUMN "provider_id" DROP NOT NULL,
ALTER COLUMN "qr_code_payload" DROP NOT NULL,
ALTER COLUMN "short_code" DROP NOT NULL;

-- AlterTable
ALTER TABLE "marketplace"."voucher_books" ADD COLUMN     "back_image_url" VARCHAR(500),
ADD COLUMN     "cover_image_url" VARCHAR(500);

-- CreateIndex
CREATE INDEX "ad_placements_content_type_idx" ON "marketplace"."ad_placements"("content_type");

-- AddForeignKey
ALTER TABLE "marketplace"."ad_placements" ADD CONSTRAINT "ad_placements_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."ad_placements" ADD CONSTRAINT "ad_placements_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
