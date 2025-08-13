-- DropForeignKey
ALTER TABLE "marketplace"."businesses" DROP CONSTRAINT "businesses_category_id_fkey";

-- AlterTable
ALTER TABLE "marketplace"."businesses" ALTER COLUMN "category_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "marketplace"."businesses" ADD CONSTRAINT "businesses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
