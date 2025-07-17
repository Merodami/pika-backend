-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketplace";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_tiger_geocoder";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('ADMIN', 'CUSTOMER', 'PROVIDER');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "payments"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "payments"."PaymentType" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "audit"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "marketplace"."VoucherState" AS ENUM ('NEW', 'PUBLISHED', 'CLAIMED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "marketplace"."VoucherDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "marketplace"."VoucherCodeType" AS ENUM ('QR', 'SHORT', 'STATIC');

-- CreateEnum
CREATE TYPE "auth"."DeviceType" AS ENUM ('ios', 'android', 'web', 'desktop');

-- CreateEnum
CREATE TYPE "auth"."MfaMethod" AS ENUM ('sms', 'totp', 'email', 'backup_codes');

-- CreateTable
CREATE TABLE "users"."addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'Paraguay',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "location" geography(Point, 4326),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "audit"."AuditAction" NOT NULL,
    "user_id" UUID,
    "data" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "firebase_uid" VARCHAR(128),
    "provider_data" JSONB NOT NULL DEFAULT '{}',
    "last_sign_in_method" VARCHAR(50),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_auth_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "auth_method" VARCHAR(50) NOT NULL,
    "provider_data" JSONB NOT NULL DEFAULT '{}',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(255),
    "device_type" "auth"."DeviceType" NOT NULL,
    "browser_info" JSONB NOT NULL DEFAULT '{}',
    "last_ip_address" INET,
    "last_location" JSONB,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "trust_expires_at" TIMESTAMPTZ(6),
    "fcm_token" VARCHAR(500),
    "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_mfa_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "preferred_method" "auth"."MfaMethod",
    "backup_codes_hash" TEXT[],
    "backup_codes_generated_at" TIMESTAMPTZ(6),
    "backup_codes_used" INTEGER NOT NULL DEFAULT 0,
    "totp_secret_encrypted" TEXT,
    "recovery_email" VARCHAR(255),
    "phone_number_verified" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mfa_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."security_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "device_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "location" JSONB,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "icon_url" VARCHAR(255),
    "slug" VARCHAR(100) NOT NULL,
    "parent_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 1,
    "path" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "preferences" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "paymentType" "payments"."PaymentType" NOT NULL,
    "card_brand" VARCHAR(50),
    "last_four" VARCHAR(4),
    "expiry_month" SMALLINT,
    "expiry_year" SMALLINT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_method_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PYG',
    "status" "payments"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_reference" VARCHAR(255),
    "processor_response" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "business_name" JSONB NOT NULL,
    "business_description" JSONB NOT NULL,
    "category_id" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "avg_rating" DECIMAL(3,2) DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "response" TEXT,
    "response_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(50),
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR(255),
    "role" "auth"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "state" "marketplace"."VoucherState" NOT NULL DEFAULT 'NEW',
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "terms" JSONB NOT NULL,
    "discount_type" "marketplace"."VoucherDiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PYG',
    "location" geography(Point, 4326),
    "image_url" VARCHAR(500),
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "max_redemptions" INTEGER,
    "max_redemptions_per_user" INTEGER NOT NULL DEFAULT 1,
    "current_redemptions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."voucher_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "code" VARCHAR(500) NOT NULL,
    "type" "marketplace"."VoucherCodeType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."voucher_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_used" VARCHAR(500) NOT NULL,
    "redeemed_at" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "users"."addresses"("user_id");

-- CreateIndex
CREATE INDEX "addresses_location_idx" ON "users"."addresses" USING GIST ("location");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit"."audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_user_id_key" ON "auth"."user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_firebase_uid_key" ON "auth"."user_identities"("firebase_uid");

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "auth"."user_identities"("user_id");

-- CreateIndex
CREATE INDEX "user_identities_provider_provider_id_idx" ON "auth"."user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_identities_firebase_uid_idx" ON "auth"."user_identities"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_id_key" ON "auth"."user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_idx" ON "auth"."user_auth_methods"("user_id");

-- CreateIndex
CREATE INDEX "user_auth_methods_auth_method_idx" ON "auth"."user_auth_methods"("auth_method");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_is_enabled_last_used_at_idx" ON "auth"."user_auth_methods"("user_id", "is_enabled", "last_used_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_methods_user_id_auth_method_key" ON "auth"."user_auth_methods"("user_id", "auth_method");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "auth"."user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_last_active_at_idx" ON "auth"."user_devices"("user_id", "last_active_at");

-- CreateIndex
CREATE INDEX "user_devices_user_id_is_trusted_trust_expires_at_idx" ON "auth"."user_devices"("user_id", "is_trusted", "trust_expires_at");

-- CreateIndex
CREATE INDEX "user_devices_fcm_token_idx" ON "auth"."user_devices"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "auth"."user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_mfa_settings_user_id_key" ON "auth"."user_mfa_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_settings_user_id_idx" ON "auth"."user_mfa_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_settings_user_id_is_enabled_idx" ON "auth"."user_mfa_settings"("user_id", "is_enabled");

-- CreateIndex
CREATE INDEX "security_events_user_id_idx" ON "auth"."security_events"("user_id");

-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "auth"."security_events"("event_type");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "auth"."security_events"("created_at");

-- CreateIndex
CREATE INDEX "security_events_risk_score_created_at_idx" ON "auth"."security_events"("risk_score", "created_at");

-- CreateIndex
CREATE INDEX "availability_provider_id_day_of_week_idx" ON "marketplace"."availability"("provider_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "availability_provider_id_day_of_week_start_time_end_time_key" ON "marketplace"."availability"("provider_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "marketplace"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "marketplace"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "marketplace"."categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_level_idx" ON "marketplace"."categories"("level");

-- CreateIndex
CREATE INDEX "categories_path_idx" ON "marketplace"."categories"("path");

-- CreateIndex
CREATE INDEX "categories_active_sort_order_idx" ON "marketplace"."categories"("active", "sort_order");

-- CreateIndex
CREATE INDEX "categories_parent_id_active_idx" ON "marketplace"."categories"("parent_id", "active");

-- CreateIndex
CREATE INDEX "categories_parent_id_slug_idx" ON "marketplace"."categories"("parent_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_key" ON "users"."customers"("user_id");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "payments"."payment_methods"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_external_reference_idx" ON "payments"."payments"("external_reference");

-- CreateIndex
CREATE UNIQUE INDEX "providers_user_id_key" ON "marketplace"."providers"("user_id");

-- CreateIndex
CREATE INDEX "providers_category_id_idx" ON "marketplace"."providers"("category_id");

-- CreateIndex
CREATE INDEX "providers_verified_active_idx" ON "marketplace"."providers"("verified", "active");

-- CreateIndex
CREATE INDEX "reviews_provider_id_idx" ON "marketplace"."reviews"("provider_id");

-- CreateIndex
CREATE INDEX "reviews_customer_id_idx" ON "marketplace"."reviews"("customer_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "marketplace"."reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"."users"("email");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"."users"("phone_number");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"."users"("deleted_at");

-- CreateIndex
CREATE INDEX "vouchers_provider_id_idx" ON "marketplace"."vouchers"("provider_id");

-- CreateIndex
CREATE INDEX "vouchers_category_id_idx" ON "marketplace"."vouchers"("category_id");

-- CreateIndex
CREATE INDEX "vouchers_state_idx" ON "marketplace"."vouchers"("state");

-- CreateIndex
CREATE INDEX "vouchers_discount_type_idx" ON "marketplace"."vouchers"("discount_type");

-- CreateIndex
CREATE INDEX "vouchers_valid_from_expires_at_idx" ON "marketplace"."vouchers"("valid_from", "expires_at");

-- CreateIndex
CREATE INDEX "vouchers_location_idx" ON "marketplace"."vouchers" USING GIST ("location");

-- CreateIndex
CREATE INDEX "vouchers_state_expires_at_idx" ON "marketplace"."vouchers"("state", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_codes_code_key" ON "marketplace"."voucher_codes"("code");

-- CreateIndex
CREATE INDEX "voucher_codes_voucher_id_idx" ON "marketplace"."voucher_codes"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_codes_code_idx" ON "marketplace"."voucher_codes"("code");

-- CreateIndex
CREATE INDEX "voucher_codes_type_is_active_idx" ON "marketplace"."voucher_codes"("type", "is_active");

-- CreateIndex
CREATE INDEX "voucher_redemptions_voucher_id_idx" ON "marketplace"."voucher_redemptions"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_redemptions_user_id_idx" ON "marketplace"."voucher_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "voucher_redemptions_redeemed_at_idx" ON "marketplace"."voucher_redemptions"("redeemed_at");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemptions_voucher_id_user_id_key" ON "marketplace"."voucher_redemptions"("voucher_id", "user_id");

-- AddForeignKey
ALTER TABLE "users"."addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_auth_methods" ADD CONSTRAINT "user_auth_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_mfa_settings" ADD CONSTRAINT "user_mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."security_events" ADD CONSTRAINT "security_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "auth"."user_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."availability" ADD CONSTRAINT "availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."providers" ADD CONSTRAINT "providers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "marketplace"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."reviews" ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."vouchers" ADD CONSTRAINT "vouchers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "marketplace"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."vouchers" ADD CONSTRAINT "vouchers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "marketplace"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_codes" ADD CONSTRAINT "voucher_codes_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "marketplace"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
