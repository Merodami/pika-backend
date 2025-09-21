-- AlterTable
ALTER TABLE "business"."businesses" ADD COLUMN     "settings" JSONB,
ADD COLUMN     "tax_id" VARCHAR(50);
