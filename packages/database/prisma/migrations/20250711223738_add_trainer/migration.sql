-- AlterTable
ALTER TABLE "sessions"."sessions" ADD COLUMN     "trainer_id" UUID;

-- CreateIndex
CREATE INDEX "sessions_trainer_id_idx" ON "sessions"."sessions"("trainer_id");

-- AddForeignKey
ALTER TABLE "sessions"."sessions" ADD CONSTRAINT "sessions_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
