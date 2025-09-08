-- CreateTable
CREATE TABLE "voucher"."voucher_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draft_id" VARCHAR(100) NOT NULL,
    "business_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "completed_steps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "step1_data" JSONB,
    "step2_data" JSONB,
    "step3_data" JSONB,
    "step4_data" JSONB,
    "step5_data" JSONB,
    "title_key" VARCHAR(255),
    "description_key" VARCHAR(255),
    "terms_and_conditions_key" VARCHAR(255),
    "qr_code" VARCHAR(500),
    "validation_errors" JSONB DEFAULT '{}',
    "last_validated_at" TIMESTAMPTZ(6),
    "session_token" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "voucher_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_drafts_draft_id_key" ON "voucher"."voucher_drafts"("draft_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_drafts_qr_code_key" ON "voucher"."voucher_drafts"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_drafts_session_token_key" ON "voucher"."voucher_drafts"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_drafts_voucher_id_key" ON "voucher"."voucher_drafts"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_drafts_draft_id_idx" ON "voucher"."voucher_drafts"("draft_id");

-- CreateIndex
CREATE INDEX "voucher_drafts_user_id_idx" ON "voucher"."voucher_drafts"("user_id");

-- CreateIndex
CREATE INDEX "voucher_drafts_business_id_idx" ON "voucher"."voucher_drafts"("business_id");

-- CreateIndex
CREATE INDEX "voucher_drafts_session_token_idx" ON "voucher"."voucher_drafts"("session_token");

-- CreateIndex
CREATE INDEX "voucher_drafts_expires_at_idx" ON "voucher"."voucher_drafts"("expires_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_current_step_idx" ON "voucher"."voucher_drafts"("current_step");

-- CreateIndex
CREATE INDEX "voucher_drafts_completed_at_idx" ON "voucher"."voucher_drafts"("completed_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_user_id_business_id_idx" ON "voucher"."voucher_drafts"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "voucher_drafts_user_id_expires_at_idx" ON "voucher"."voucher_drafts"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_business_id_created_at_idx" ON "voucher"."voucher_drafts"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_expires_at_completed_at_idx" ON "voucher"."voucher_drafts"("expires_at", "completed_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_user_id_is_complete_expires_at_idx" ON "voucher"."voucher_drafts"("user_id", "is_complete", "expires_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_current_step_user_id_idx" ON "voucher"."voucher_drafts"("current_step", "user_id");

-- CreateIndex
CREATE INDEX "voucher_drafts_is_complete_created_at_idx" ON "voucher"."voucher_drafts"("is_complete", "created_at");

-- CreateIndex
CREATE INDEX "voucher_drafts_business_id_is_complete_created_at_idx" ON "voucher"."voucher_drafts"("business_id", "is_complete", "created_at");

-- AddForeignKey
ALTER TABLE "voucher"."voucher_drafts" ADD CONSTRAINT "voucher_drafts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher"."voucher_drafts" ADD CONSTRAINT "voucher_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher"."voucher_drafts" ADD CONSTRAINT "voucher_drafts_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"."vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
