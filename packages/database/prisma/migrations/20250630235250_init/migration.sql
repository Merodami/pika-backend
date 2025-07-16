-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "gyms";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sessions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "social";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "storage";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "support";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('ADMIN', 'MEMBER', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'UNCONFIRMED');

-- CreateEnum
CREATE TYPE "audit"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "users"."FriendOrClientType" AS ENUM ('FRIEND', 'CLIENT');

-- CreateEnum
CREATE TYPE "users"."FriendStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "social"."ActivityType" AS ENUM ('SESSION_BOOKED', 'SESSION_COMPLETED', 'SESSION_REVIEWED', 'FRIEND_ADDED', 'USER_FOLLOWED', 'GYM_VISITED', 'ACHIEVEMENT_EARNED', 'PROFILE_UPDATED', 'ENTITY_LIKED', 'ENTITY_SHARED', 'ENTITY_COMMENTED', 'ENTITY_BOOKMARKED');

-- CreateEnum
CREATE TYPE "social"."PrivacyLevel" AS ENUM ('PUBLIC', 'FRIENDS', 'FOLLOWERS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "social"."InteractionType" AS ENUM ('LIKE', 'COMMENT', 'SHARE', 'BOOKMARK');

-- CreateEnum
CREATE TYPE "gyms"."StuffType" AS ENUM ('EQUIPMENT', 'AMENITY', 'FEATURE');

-- CreateEnum
CREATE TYPE "gyms"."WeekDay" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateEnum
CREATE TYPE "support"."ProblemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "support"."ProblemPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "sessions"."SessionStatus" AS ENUM ('UPCOMING', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateEnum
CREATE TYPE "sessions"."SessionPurpose" AS ENUM ('WORKING', 'WORKOUT', 'CONTENT');

-- CreateEnum
CREATE TYPE "sessions"."TeamSize" AS ENUM ('CREATOR', 'BRAND', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "sessions"."InviteeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "sessions"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "sessions"."WaitingListStatus" AS ENUM ('WAITING', 'ACCEPTED', 'DECLINED', 'LEFT');

-- CreateEnum
CREATE TYPE "sessions"."SessionRating" AS ENUM ('SAD', 'NEUTRAL', 'HAPPY');

-- CreateEnum
CREATE TYPE "auth"."DeviceType" AS ENUM ('ios', 'android', 'web', 'desktop');

-- CreateEnum
CREATE TYPE "auth"."MfaMethod" AS ENUM ('sms', 'totp', 'email', 'backup_codes');

-- CreateTable
CREATE TABLE "social"."activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "social"."ActivityType" NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB,
    "privacy" "social"."PrivacyLevel" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'United States',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "support"."communication_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "type" VARCHAR(20) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "template_id" UUID,
    "status" VARCHAR(20) NOT NULL,
    "provider" VARCHAR(50),
    "provider_id" VARCHAR(255),
    "metadata" JSONB,
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage"."file_storage_logs" (
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

-- CreateTable
CREATE TABLE "social"."follows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."friends" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" VARCHAR(255),
    "type" "users"."FriendOrClientType" NOT NULL DEFAULT 'FRIEND',
    "status" "users"."FriendStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referred_user_id" UUID,
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."gyms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "opening_hours" TEXT NOT NULL,
    "area" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price_range" TEXT NOT NULL,
    "pictures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "house_rules" TEXT,
    "status" TEXT NOT NULL,
    "public_transport" TEXT,
    "parking" TEXT,
    "is_partner" BOOLEAN NOT NULL DEFAULT false,
    "partner" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."gym_hourly_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "day" "gyms"."WeekDay" NOT NULL,
    "hour" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_hourly_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."gym_special_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_special_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."stuff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" "gyms"."StuffType" NOT NULL DEFAULT 'EQUIPMENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gym_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stuff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms"."inductions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."parq" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "medical_clearance" BOOLEAN NOT NULL,
    "existing_injuries" BOOLEAN NOT NULL,
    "symptoms_check" BOOLEAN NOT NULL,
    "doctor_consultation" BOOLEAN NOT NULL,
    "experience_level" BOOLEAN NOT NULL,
    "proper_technique" BOOLEAN NOT NULL,
    "gym_etiquette" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."credits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amount_demand" INTEGER NOT NULL DEFAULT 0,
    "amount_sub" INTEGER NOT NULL DEFAULT 0,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."credits_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "credits_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'demand',
    "transaction_id" TEXT,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."credits_packs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "credits_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "allowed_times" INTEGER NOT NULL,
    "amount_available" INTEGER NOT NULL,
    "expiration_date" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."promo_code_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promo_code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "transaction_id" TEXT,
    "used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_code_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "plan_type" TEXT NOT NULL DEFAULT 'basic',
    "subscription_start_date" TIMESTAMPTZ(6),
    "subscription_end_date" TIMESTAMPTZ(6),
    "last_payment_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."problems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "support"."ProblemStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "support"."ProblemPriority" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."professionals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favorite_gyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions"."sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "sessions"."SessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "payment_deadline" TIMESTAMPTZ(6),
    "price" INTEGER NOT NULL,
    "guests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "purpose" "sessions"."SessionPurpose" NOT NULL,
    "team_size" "sessions"."TeamSize",
    "feedback" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions"."session_invitees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "friend_id" UUID NOT NULL,
    "status" "sessions"."InviteeStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_invitees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions"."invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "guest_email" VARCHAR(255) NOT NULL,
    "friend_id" UUID,
    "status" "sessions"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions"."waiting_list" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" "sessions"."WaitingListStatus" NOT NULL DEFAULT 'WAITING',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waiting_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions"."session_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" "sessions"."SessionRating" NOT NULL,
    "reason" TEXT,
    "image" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions"."session_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "modified_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social"."social_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "type" "social"."InteractionType" NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "social_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL,
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "credits_amount" INTEGER NOT NULL,
    "trial_period_days" INTEGER,
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "stripe_product_id" TEXT,
    "stripe_price_id" TEXT,
    "membership_type" TEXT,
    "membership_package" TEXT,
    "gym_access_times" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID,
    "plan_type" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billing_interval" TEXT NOT NULL DEFAULT 'monthly',
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "trial_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "last_processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."support_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "problem_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50),
    "external_id" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "description" TEXT,
    "variables" JSONB,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
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
    "role" "auth"."UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "date_of_birth" DATE,
    "alias" VARCHAR(50),
    "app_version" VARCHAR(20),
    "active_membership" BOOLEAN NOT NULL DEFAULT false,
    "guests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stripe_user_id" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_user_id_idx" ON "social"."activities"("user_id");

-- CreateIndex
CREATE INDEX "activities_created_at_idx" ON "social"."activities"("created_at");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "social"."activities"("type");

-- CreateIndex
CREATE INDEX "activities_entity_type_entity_id_idx" ON "social"."activities"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activities_user_id_created_at_idx" ON "social"."activities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_privacy_created_at_idx" ON "social"."activities"("privacy", "created_at" DESC);

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "users"."addresses"("user_id");

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
CREATE INDEX "communication_logs_user_id_idx" ON "support"."communication_logs"("user_id");

-- CreateIndex
CREATE INDEX "communication_logs_type_status_idx" ON "support"."communication_logs"("type", "status");

-- CreateIndex
CREATE INDEX "communication_logs_recipient_idx" ON "support"."communication_logs"("recipient");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "support"."communication_logs"("created_at");

-- CreateIndex
CREATE INDEX "communication_logs_template_id_idx" ON "support"."communication_logs"("template_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_user_id_idx" ON "storage"."file_storage_logs"("user_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_file_id_idx" ON "storage"."file_storage_logs"("file_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_status_idx" ON "storage"."file_storage_logs"("status");

-- CreateIndex
CREATE INDEX "file_storage_logs_folder_idx" ON "storage"."file_storage_logs"("folder");

-- CreateIndex
CREATE INDEX "file_storage_logs_content_type_idx" ON "storage"."file_storage_logs"("content_type");

-- CreateIndex
CREATE INDEX "file_storage_logs_created_at_idx" ON "storage"."file_storage_logs"("created_at");

-- CreateIndex
CREATE INDEX "file_storage_logs_is_public_idx" ON "storage"."file_storage_logs"("is_public");

-- CreateIndex
CREATE INDEX "follows_follower_id_idx" ON "social"."follows"("follower_id");

-- CreateIndex
CREATE INDEX "follows_following_id_idx" ON "social"."follows"("following_id");

-- CreateIndex
CREATE INDEX "follows_follower_id_created_at_idx" ON "social"."follows"("follower_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "follows_following_id_created_at_idx" ON "social"."follows"("following_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "social"."follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "friends_user_id_idx" ON "users"."friends"("user_id");

-- CreateIndex
CREATE INDEX "friends_referred_user_id_idx" ON "users"."friends"("referred_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "friends_user_id_email_key" ON "users"."friends"("user_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "gym_hourly_prices_gym_id_day_hour_key" ON "gyms"."gym_hourly_prices"("gym_id", "day", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "gym_special_prices_gym_id_date_hour_key" ON "gyms"."gym_special_prices"("gym_id", "date", "hour");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "support"."notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "support"."notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "support"."notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "parq_user_id_key" ON "users"."parq"("user_id");

-- CreateIndex
CREATE INDEX "parq_user_id_idx" ON "users"."parq"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "credits_user_id_key" ON "payments"."credits"("user_id");

-- CreateIndex
CREATE INDEX "credits_history_user_id_idx" ON "payments"."credits_history"("user_id");

-- CreateIndex
CREATE INDEX "credits_history_credits_id_idx" ON "payments"."credits_history"("credits_id");

-- CreateIndex
CREATE INDEX "credits_history_date_idx" ON "payments"."credits_history"("date");

-- CreateIndex
CREATE INDEX "credits_packs_active_idx" ON "payments"."credits_packs"("active");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "payments"."promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_code_idx" ON "payments"."promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_active_idx" ON "payments"."promo_codes"("active");

-- CreateIndex
CREATE INDEX "promo_codes_expiration_date_idx" ON "payments"."promo_codes"("expiration_date");

-- CreateIndex
CREATE INDEX "promo_code_usages_promo_code_id_idx" ON "payments"."promo_code_usages"("promo_code_id");

-- CreateIndex
CREATE INDEX "promo_code_usages_user_id_idx" ON "payments"."promo_code_usages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_key" ON "payments"."memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_stripe_customer_id_key" ON "payments"."memberships"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "memberships_stripe_customer_id_idx" ON "payments"."memberships"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "memberships_stripe_subscription_id_idx" ON "payments"."memberships"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "memberships_subscription_status_idx" ON "payments"."memberships"("subscription_status");

-- CreateIndex
CREATE INDEX "problems_user_id_idx" ON "support"."problems"("user_id");

-- CreateIndex
CREATE INDEX "problems_status_idx" ON "support"."problems"("status");

-- CreateIndex
CREATE INDEX "problems_priority_idx" ON "support"."problems"("priority");

-- CreateIndex
CREATE INDEX "problems_created_at_idx" ON "support"."problems"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_user_id_key" ON "users"."professionals"("user_id");

-- CreateIndex
CREATE INDEX "professionals_user_id_idx" ON "users"."professionals"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_gym_id_idx" ON "sessions"."sessions"("gym_id");

-- CreateIndex
CREATE INDEX "sessions_date_idx" ON "sessions"."sessions"("date");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"."sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_payment_deadline_idx" ON "sessions"."sessions"("payment_deadline");

-- CreateIndex
CREATE INDEX "session_invitees_session_id_idx" ON "sessions"."session_invitees"("session_id");

-- CreateIndex
CREATE INDEX "session_invitees_friend_id_idx" ON "sessions"."session_invitees"("friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_invitees_session_id_friend_id_key" ON "sessions"."session_invitees"("session_id", "friend_id");

-- CreateIndex
CREATE INDEX "invitations_user_id_idx" ON "sessions"."invitations"("user_id");

-- CreateIndex
CREATE INDEX "invitations_session_id_idx" ON "sessions"."invitations"("session_id");

-- CreateIndex
CREATE INDEX "invitations_guest_email_idx" ON "sessions"."invitations"("guest_email");

-- CreateIndex
CREATE INDEX "waiting_list_session_id_joined_at_idx" ON "sessions"."waiting_list"("session_id", "joined_at");

-- CreateIndex
CREATE INDEX "waiting_list_user_id_idx" ON "sessions"."waiting_list"("user_id");

-- CreateIndex
CREATE INDEX "session_reviews_session_id_idx" ON "sessions"."session_reviews"("session_id");

-- CreateIndex
CREATE INDEX "session_reviews_user_id_idx" ON "sessions"."session_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_reviews_session_id_user_id_key" ON "sessions"."session_reviews"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "session_records_session_id_idx" ON "sessions"."session_records"("session_id");

-- CreateIndex
CREATE INDEX "session_records_created_at_idx" ON "sessions"."session_records"("created_at");

-- CreateIndex
CREATE INDEX "social_interactions_entity_type_entity_id_idx" ON "social"."social_interactions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "social_interactions_user_id_idx" ON "social"."social_interactions"("user_id");

-- CreateIndex
CREATE INDEX "social_interactions_type_idx" ON "social"."social_interactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "social_interactions_user_id_entity_type_entity_id_type_key" ON "social"."social_interactions"("user_id", "entity_type", "entity_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "payments"."subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripe_product_id_key" ON "payments"."subscription_plans"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripe_price_id_key" ON "payments"."subscription_plans"("stripe_price_id");

-- CreateIndex
CREATE INDEX "subscription_plans_is_active_idx" ON "payments"."subscription_plans"("is_active");

-- CreateIndex
CREATE INDEX "subscription_plans_interval_idx" ON "payments"."subscription_plans"("interval");

-- CreateIndex
CREATE INDEX "subscription_plans_membership_type_idx" ON "payments"."subscription_plans"("membership_type");

-- CreateIndex
CREATE INDEX "subscription_plans_membership_package_idx" ON "payments"."subscription_plans"("membership_package");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "payments"."subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "payments"."subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "payments"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "payments"."subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_type_idx" ON "payments"."subscriptions"("plan_type");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "payments"."subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "support_comments_problem_id_idx" ON "support"."support_comments"("problem_id");

-- CreateIndex
CREATE INDEX "support_comments_user_id_idx" ON "support"."support_comments"("user_id");

-- CreateIndex
CREATE INDEX "support_comments_created_at_idx" ON "support"."support_comments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_key" ON "support"."templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "templates_external_id_key" ON "support"."templates"("external_id");

-- CreateIndex
CREATE INDEX "templates_type_is_active_idx" ON "support"."templates"("type", "is_active");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "support"."templates"("category");

-- CreateIndex
CREATE INDEX "templates_name_idx" ON "support"."templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_alias_key" ON "users"."users"("alias");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"."users"("email");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"."users"("phone_number");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"."users"("deleted_at");

-- AddForeignKey
ALTER TABLE "social"."activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "support"."communication_logs" ADD CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."communication_logs" ADD CONSTRAINT "communication_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "support"."templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage"."file_storage_logs" ADD CONSTRAINT "file_storage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."friends" ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."friends" ADD CONSTRAINT "friends_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_hourly_prices" ADD CONSTRAINT "gym_hourly_prices_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."gym_special_prices" ADD CONSTRAINT "gym_special_prices_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."stuff" ADD CONSTRAINT "stuff_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."inductions" ADD CONSTRAINT "inductions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gyms"."inductions" ADD CONSTRAINT "inductions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."parq" ADD CONSTRAINT "parq_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."credits" ADD CONSTRAINT "credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."credits_history" ADD CONSTRAINT "credits_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."credits_history" ADD CONSTRAINT "credits_history_credits_id_fkey" FOREIGN KEY ("credits_id") REFERENCES "payments"."credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."promo_code_usages" ADD CONSTRAINT "promo_code_usages_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "payments"."promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."promo_code_usages" ADD CONSTRAINT "promo_code_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."problems" ADD CONSTRAINT "problems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."professionals" ADD CONSTRAINT "professionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."sessions" ADD CONSTRAINT "sessions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"."gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."session_invitees" ADD CONSTRAINT "session_invitees_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."session_invitees" ADD CONSTRAINT "session_invitees_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"."friends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."invitations" ADD CONSTRAINT "invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."invitations" ADD CONSTRAINT "invitations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."invitations" ADD CONSTRAINT "invitations_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"."friends"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."waiting_list" ADD CONSTRAINT "waiting_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."waiting_list" ADD CONSTRAINT "waiting_list_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."session_reviews" ADD CONSTRAINT "session_reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."session_reviews" ADD CONSTRAINT "session_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."session_records" ADD CONSTRAINT "session_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."social_interactions" ADD CONSTRAINT "social_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "payments"."subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."support_comments" ADD CONSTRAINT "support_comments_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "support"."problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."support_comments" ADD CONSTRAINT "support_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
