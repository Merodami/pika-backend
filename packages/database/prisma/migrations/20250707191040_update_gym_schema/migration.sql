-- DropForeignKey
ALTER TABLE "gyms"."gyms" DROP CONSTRAINT "gyms_owner_id_fkey";

-- AlterTable
ALTER TABLE "gyms"."gyms" ALTER COLUMN "owner_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "gyms"."gyms" ADD CONSTRAINT "gyms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
