-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "favourites";

-- AlterTable
ALTER TABLE "business"."businesses" ADD COLUMN     "favorite_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "voucher"."vouchers" ADD COLUMN     "favorite_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "favourites"."favourite_businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourite_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favourites"."favourite_vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourite_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favourite_businesses_user_id_idx" ON "favourites"."favourite_businesses"("user_id");

-- CreateIndex
CREATE INDEX "favourite_businesses_business_id_idx" ON "favourites"."favourite_businesses"("business_id");

-- CreateIndex
CREATE INDEX "favourite_businesses_created_at_idx" ON "favourites"."favourite_businesses"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "favourite_businesses_user_id_business_id_key" ON "favourites"."favourite_businesses"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "favourite_vouchers_user_id_idx" ON "favourites"."favourite_vouchers"("user_id");

-- CreateIndex
CREATE INDEX "favourite_vouchers_voucher_id_idx" ON "favourites"."favourite_vouchers"("voucher_id");

-- CreateIndex
CREATE INDEX "favourite_vouchers_created_at_idx" ON "favourites"."favourite_vouchers"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "favourite_vouchers_user_id_voucher_id_key" ON "favourites"."favourite_vouchers"("user_id", "voucher_id");

-- CreateIndex
CREATE INDEX "businesses_favorite_count_idx" ON "business"."businesses"("favorite_count" DESC);

-- CreateIndex
CREATE INDEX "vouchers_favorite_count_idx" ON "voucher"."vouchers"("favorite_count" DESC);

-- AddForeignKey
ALTER TABLE "favourites"."favourite_businesses" ADD CONSTRAINT "favourite_businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites"."favourite_businesses" ADD CONSTRAINT "favourite_businesses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"."businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites"."favourite_vouchers" ADD CONSTRAINT "favourite_vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourites"."favourite_vouchers" ADD CONSTRAINT "favourite_vouchers_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
