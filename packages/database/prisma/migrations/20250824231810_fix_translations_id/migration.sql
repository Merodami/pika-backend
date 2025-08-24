/*
  Warnings:

  - The primary key for the `translations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `translations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user_language_preferences` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `user_language_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "business"."business_details" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "business"."business_registration" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "i18n"."languages" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "i18n"."translations" DROP CONSTRAINT "translations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "translations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "i18n"."user_language_preferences" DROP CONSTRAINT "user_language_preferences_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("id");
