-- CreateIndex
CREATE INDEX "voucher_books_status_year_month_idx" ON "marketplace"."voucher_books"("status", "year", "month");

-- CreateIndex
CREATE INDEX "voucher_books_book_type_status_idx" ON "marketplace"."voucher_books"("book_type", "status");

-- CreateIndex
CREATE INDEX "voucher_books_pdf_generated_at_idx" ON "marketplace"."voucher_books"("pdf_generated_at");

-- CreateIndex
CREATE INDEX "voucher_books_published_at_idx" ON "marketplace"."voucher_books"("published_at");

-- CreateIndex
CREATE INDEX "voucher_books_created_at_idx" ON "marketplace"."voucher_books"("created_at");

-- CreateIndex
CREATE INDEX "voucher_books_deleted_at_idx" ON "marketplace"."voucher_books"("deleted_at");
