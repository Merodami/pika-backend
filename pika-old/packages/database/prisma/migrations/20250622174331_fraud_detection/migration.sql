-- CreateEnum
CREATE TYPE "marketplace"."FraudCaseStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'FALSE_POSITIVE');

-- CreateTable
CREATE TABLE "marketplace"."fraud_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_number" VARCHAR(20) NOT NULL,
    "redemption_id" UUID NOT NULL,
    "detected_at" TIMESTAMPTZ(6) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "flags" JSONB NOT NULL,
    "detection_metadata" JSONB,
    "customer_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "status" "marketplace"."FraudCaseStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "actions_taken" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."fraud_case_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fraud_case_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "previous_status" "marketplace"."FraudCaseStatus",
    "new_status" "marketplace"."FraudCaseStatus",
    "performed_by" UUID NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_case_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fraud_cases_case_number_key" ON "marketplace"."fraud_cases"("case_number");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_cases_redemption_id_key" ON "marketplace"."fraud_cases"("redemption_id");

-- CreateIndex
CREATE INDEX "fraud_cases_status_idx" ON "marketplace"."fraud_cases"("status");

-- CreateIndex
CREATE INDEX "fraud_cases_customer_id_idx" ON "marketplace"."fraud_cases"("customer_id");

-- CreateIndex
CREATE INDEX "fraud_cases_provider_id_idx" ON "marketplace"."fraud_cases"("provider_id");

-- CreateIndex
CREATE INDEX "fraud_cases_detected_at_idx" ON "marketplace"."fraud_cases"("detected_at");

-- CreateIndex
CREATE INDEX "fraud_cases_risk_score_idx" ON "marketplace"."fraud_cases"("risk_score");

-- CreateIndex
CREATE INDEX "fraud_case_history_fraud_case_id_idx" ON "marketplace"."fraud_case_history"("fraud_case_id");

-- CreateIndex
CREATE INDEX "fraud_case_history_created_at_idx" ON "marketplace"."fraud_case_history"("created_at");

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_cases" ADD CONSTRAINT "fraud_cases_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "marketplace"."voucher_redemptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_cases" ADD CONSTRAINT "fraud_cases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_cases" ADD CONSTRAINT "fraud_cases_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_cases" ADD CONSTRAINT "fraud_cases_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_cases" ADD CONSTRAINT "fraud_cases_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_case_history" ADD CONSTRAINT "fraud_case_history_fraud_case_id_fkey" FOREIGN KEY ("fraud_case_id") REFERENCES "marketplace"."fraud_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."fraud_case_history" ADD CONSTRAINT "fraud_case_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
