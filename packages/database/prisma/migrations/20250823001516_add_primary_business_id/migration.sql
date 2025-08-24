-- AlterTable
ALTER TABLE "users"."users" ADD COLUMN     "primary_business_id" UUID;

-- CreateIndex
CREATE INDEX "users_primary_business_id_idx" ON "users"."users"("primary_business_id");

-- AddForeignKey
ALTER TABLE "users"."users" ADD CONSTRAINT "users_primary_business_id_fkey" FOREIGN KEY ("primary_business_id") REFERENCES "business"."businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
