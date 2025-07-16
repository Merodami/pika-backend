-- AlterTable
ALTER TABLE "users"."friends" ALTER COLUMN "avatar_url" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "users"."users" ALTER COLUMN "avatar_url" SET DATA TYPE VARCHAR(1000);
