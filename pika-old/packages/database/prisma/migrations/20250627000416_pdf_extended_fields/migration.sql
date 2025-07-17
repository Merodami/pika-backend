/*
  Warnings:

  - Added the required column `created_by` to the `voucher_books` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "marketplace"."voucher_books" ADD COLUMN     "created_by" UUID NOT NULL,
ADD COLUMN     "provider_id" UUID;

-- CreateIndex
CREATE INDEX "voucher_books_created_by_idx" ON "marketplace"."voucher_books"("created_by");

-- CreateIndex
CREATE INDEX "voucher_books_provider_id_idx" ON "marketplace"."voucher_books"("provider_id");

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_books" ADD CONSTRAINT "voucher_books_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_books" ADD CONSTRAINT "voucher_books_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
