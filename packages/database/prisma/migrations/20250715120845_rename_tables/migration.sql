/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "files";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateEnum
CREATE TYPE "identity"."UserRole" AS ENUM ('ADMIN', 'MEMBER', 'PROFESSIONAL', 'THERAPIST', 'CONTENT_CREATOR');

-- CreateEnum
CREATE TYPE "identity"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'UNCONFIRMED');

-- CreateEnum
CREATE TYPE "identity"."DeviceType" AS ENUM ('ios', 'android', 'web', 'desktop');

-- CreateEnum
CREATE TYPE "identity"."MfaMethod" AS ENUM ('sms', 'totp', 'email', 'backup_codes');

-- AlterTable
ALTER TABLE "users"."users" DROP COLUMN "role",
ADD COLUMN     "role" "identity"."UserRole" NOT NULL DEFAULT 'ADMIN',
DROP COLUMN "status",
ADD COLUMN     "status" "identity"."UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "identity"."user_identities" (
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
CREATE TABLE "identity"."user_auth_methods" (
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
CREATE TABLE "identity"."user_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(255),
    "device_type" "identity"."DeviceType" NOT NULL,
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
CREATE TABLE "identity"."user_mfa_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "preferred_method" "identity"."MfaMethod",
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
CREATE TABLE "identity"."security_events" (
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
CREATE TABLE "files"."file_storage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "provider" VARCHAR(50),
    "uploaded_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_storage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_user_id_key" ON "identity"."user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_firebase_uid_key" ON "identity"."user_identities"("firebase_uid");

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "identity"."user_identities"("user_id");

-- CreateIndex
CREATE INDEX "user_identities_provider_provider_id_idx" ON "identity"."user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_identities_firebase_uid_idx" ON "identity"."user_identities"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_id_key" ON "identity"."user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_idx" ON "identity"."user_auth_methods"("user_id");

-- CreateIndex
CREATE INDEX "user_auth_methods_auth_method_idx" ON "identity"."user_auth_methods"("auth_method");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_is_enabled_last_used_at_idx" ON "identity"."user_auth_methods"("user_id", "is_enabled", "last_used_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_methods_user_id_auth_method_key" ON "identity"."user_auth_methods"("user_id", "auth_method");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "identity"."user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_last_active_at_idx" ON "identity"."user_devices"("user_id", "last_active_at");

-- CreateIndex
CREATE INDEX "user_devices_user_id_is_trusted_trust_expires_at_idx" ON "identity"."user_devices"("user_id", "is_trusted", "trust_expires_at");

-- CreateIndex
CREATE INDEX "user_devices_fcm_token_idx" ON "identity"."user_devices"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "identity"."user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_mfa_settings_user_id_key" ON "identity"."user_mfa_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_settings_user_id_idx" ON "identity"."user_mfa_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_settings_user_id_is_enabled_idx" ON "identity"."user_mfa_settings"("user_id", "is_enabled");

-- CreateIndex
CREATE INDEX "security_events_user_id_idx" ON "identity"."security_events"("user_id");

-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "identity"."security_events"("event_type");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "identity"."security_events"("created_at");

-- CreateIndex
CREATE INDEX "security_events_risk_score_created_at_idx" ON "identity"."security_events"("risk_score", "created_at");

-- CreateIndex
CREATE INDEX "file_storage_logs_user_id_idx" ON "files"."file_storage_logs"("user_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_file_id_idx" ON "files"."file_storage_logs"("file_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_status_idx" ON "files"."file_storage_logs"("status");

-- CreateIndex
CREATE INDEX "file_storage_logs_folder_idx" ON "files"."file_storage_logs"("folder");

-- CreateIndex
CREATE INDEX "file_storage_logs_content_type_idx" ON "files"."file_storage_logs"("content_type");

-- CreateIndex
CREATE INDEX "file_storage_logs_created_at_idx" ON "files"."file_storage_logs"("created_at");

-- CreateIndex
CREATE INDEX "file_storage_logs_is_public_idx" ON "files"."file_storage_logs"("is_public");

-- AddForeignKey
ALTER TABLE "identity"."user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_auth_methods" ADD CONSTRAINT "user_auth_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_mfa_settings" ADD CONSTRAINT "user_mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."security_events" ADD CONSTRAINT "security_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "identity"."user_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."file_storage_logs" ADD CONSTRAINT "file_storage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
