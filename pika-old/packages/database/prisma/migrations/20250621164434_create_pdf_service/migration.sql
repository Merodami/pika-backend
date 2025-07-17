-- CreateEnum
CREATE TYPE "marketplace"."VoucherBookStatus" AS ENUM ('DRAFT', 'READY_FOR_PRINT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "marketplace"."VoucherBookType" AS ENUM ('MONTHLY', 'SPECIAL_EDITION', 'REGIONAL', 'SEASONAL', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "marketplace"."PageLayoutType" AS ENUM ('STANDARD', 'MIXED', 'FULL_PAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "marketplace"."AdSize" AS ENUM ('SINGLE', 'QUARTER', 'HALF', 'FULL');

-- CreateTable
CREATE TABLE "marketplace"."voucher_books" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "edition" VARCHAR(100),
    "book_type" "marketplace"."VoucherBookType" NOT NULL DEFAULT 'MONTHLY',
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "status" "marketplace"."VoucherBookStatus" NOT NULL DEFAULT 'DRAFT',
    "total_pages" INTEGER NOT NULL DEFAULT 24,
    "published_at" TIMESTAMPTZ(6),
    "pdf_url" VARCHAR(500),
    "pdf_generated_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "voucher_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."voucher_book_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "page_number" INTEGER NOT NULL,
    "layout_type" "marketplace"."PageLayoutType" NOT NULL DEFAULT 'STANDARD',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_book_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."ad_placements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "size" "marketplace"."AdSize" NOT NULL DEFAULT 'SINGLE',
    "image_url" VARCHAR(500),
    "qr_code_payload" TEXT NOT NULL,
    "short_code" VARCHAR(20) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."book_distributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "distributor_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "distributed_at" TIMESTAMPTZ(6) NOT NULL,
    "location" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voucher_books_status_idx" ON "marketplace"."voucher_books"("status");

-- CreateIndex
CREATE INDEX "voucher_books_year_month_idx" ON "marketplace"."voucher_books"("year", "month");

-- CreateIndex
CREATE INDEX "voucher_books_book_type_idx" ON "marketplace"."voucher_books"("book_type");

-- CreateIndex
CREATE INDEX "voucher_books_edition_idx" ON "marketplace"."voucher_books"("edition");

-- CreateIndex
CREATE INDEX "voucher_book_pages_book_id_idx" ON "marketplace"."voucher_book_pages"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_book_pages_book_id_page_number_key" ON "marketplace"."voucher_book_pages"("book_id", "page_number");

-- CreateIndex
CREATE INDEX "ad_placements_page_id_idx" ON "marketplace"."ad_placements"("page_id");

-- CreateIndex
CREATE INDEX "ad_placements_voucher_id_idx" ON "marketplace"."ad_placements"("voucher_id");

-- CreateIndex
CREATE INDEX "ad_placements_provider_id_idx" ON "marketplace"."ad_placements"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_placements_page_id_position_key" ON "marketplace"."ad_placements"("page_id", "position");

-- CreateIndex
CREATE INDEX "book_distributions_book_id_idx" ON "marketplace"."book_distributions"("book_id");

-- CreateIndex
CREATE INDEX "book_distributions_distributed_at_idx" ON "marketplace"."book_distributions"("distributed_at");

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_book_pages" ADD CONSTRAINT "voucher_book_pages_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "marketplace"."voucher_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."ad_placements" ADD CONSTRAINT "ad_placements_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "marketplace"."voucher_book_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."ad_placements" ADD CONSTRAINT "ad_placements_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."ad_placements" ADD CONSTRAINT "ad_placements_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."book_distributions" ADD CONSTRAINT "book_distributions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "marketplace"."voucher_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
