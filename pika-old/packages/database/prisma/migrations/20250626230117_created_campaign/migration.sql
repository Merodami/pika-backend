-- CreateEnum
CREATE TYPE "marketplace"."CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "marketplace"."campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "status" "marketplace"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "target_audience" JSONB,
    "objectives" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_provider_id_idx" ON "marketplace"."campaigns"("provider_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "marketplace"."campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_active_idx" ON "marketplace"."campaigns"("active");

-- CreateIndex
CREATE INDEX "campaigns_start_date_end_date_idx" ON "marketplace"."campaigns"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "campaigns_provider_id_status_idx" ON "marketplace"."campaigns"("provider_id", "status");

-- CreateIndex
CREATE INDEX "campaigns_provider_id_active_idx" ON "marketplace"."campaigns"("provider_id", "active");

-- CreateIndex
CREATE INDEX "campaigns_status_active_idx" ON "marketplace"."campaigns"("status", "active");

-- AddForeignKey
ALTER TABLE "marketplace"."campaigns" ADD CONSTRAINT "campaigns_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
