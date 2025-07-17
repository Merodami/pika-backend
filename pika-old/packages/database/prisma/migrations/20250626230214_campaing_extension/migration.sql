-- CreateIndex
CREATE INDEX "campaigns_status_start_date_end_date_idx" ON "marketplace"."campaigns"("status", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "campaigns_provider_id_status_active_start_date_idx" ON "marketplace"."campaigns"("provider_id", "status", "active", "start_date");

-- CreateIndex
CREATE INDEX "campaigns_end_date_status_idx" ON "marketplace"."campaigns"("end_date", "status");

-- CreateIndex
CREATE INDEX "campaigns_budget_idx" ON "marketplace"."campaigns"("budget");
