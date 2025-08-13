-- DropIndex
DROP INDEX "marketplace"."businesses_user_id_key";

-- CreateIndex
CREATE INDEX "businesses_user_id_idx" ON "marketplace"."businesses"("user_id");
