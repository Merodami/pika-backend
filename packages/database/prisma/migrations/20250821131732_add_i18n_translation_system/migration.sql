-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "i18n";

-- CreateTable
CREATE TABLE "business"."business_details" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "street" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(2),
    "operating_hours" JSONB,
    "social_media" JSONB,
    "additional_info" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "i18n"."languages" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'ltr',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "i18n"."translations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "context" TEXT,
    "service" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "i18n"."user_language_preferences" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "language_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_details_businessId_key" ON "business"."business_details"("businessId");

-- CreateIndex
CREATE INDEX "business_details_businessId_idx" ON "business"."business_details"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_language_code_key" ON "i18n"."translations"("key", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "user_language_preferences_user_id_key" ON "i18n"."user_language_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_language_preferences_user_id_idx" ON "i18n"."user_language_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "business"."business_details" ADD CONSTRAINT "business_details_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"."businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "i18n"."translations" ADD CONSTRAINT "translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "i18n"."languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "i18n"."user_language_preferences" ADD CONSTRAINT "user_language_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "i18n"."user_language_preferences" ADD CONSTRAINT "user_language_preferences_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "i18n"."languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
