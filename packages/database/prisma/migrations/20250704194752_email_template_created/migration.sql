/*
  Warnings:

  - You are about to drop the column `day` on the `gym_hourly_prices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gym_id,day_of_week,hour]` on the table `gym_hourly_prices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `day_of_week` to the `gym_hourly_prices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "support"."communication_logs" DROP CONSTRAINT "communication_logs_template_id_fkey";

-- DropIndex
DROP INDEX "gyms"."gym_hourly_prices_gym_id_day_hour_key";

-- AlterTable
ALTER TABLE "gyms"."gym_hourly_prices" DROP COLUMN "day",
ADD COLUMN     "day_of_week" "gyms"."WeekDay" NOT NULL;

-- AlterTable
ALTER TABLE "support"."communication_logs" ALTER COLUMN "template_id" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "gym_hourly_prices_gym_id_day_of_week_hour_key" ON "gyms"."gym_hourly_prices"("gym_id", "day_of_week", "hour");
