--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY users.professionals DROP CONSTRAINT IF EXISTS professionals_user_id_fkey;
ALTER TABLE IF EXISTS ONLY users.parq DROP CONSTRAINT IF EXISTS parq_user_id_fkey;
ALTER TABLE IF EXISTS ONLY users.friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE IF EXISTS ONLY users.friends DROP CONSTRAINT IF EXISTS friends_referred_user_id_fkey;
ALTER TABLE IF EXISTS ONLY users.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.support_comments DROP CONSTRAINT IF EXISTS support_comments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.support_comments DROP CONSTRAINT IF EXISTS support_comments_problem_id_fkey;
ALTER TABLE IF EXISTS ONLY support.problems DROP CONSTRAINT IF EXISTS problems_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.problems DROP CONSTRAINT IF EXISTS problems_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY support.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.communication_logs DROP CONSTRAINT IF EXISTS communication_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.file_storage_logs DROP CONSTRAINT IF EXISTS file_storage_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY social.social_interactions DROP CONSTRAINT IF EXISTS social_interactions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY social.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE IF EXISTS ONLY social.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE IF EXISTS ONLY social.activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.waiting_list DROP CONSTRAINT IF EXISTS waiting_list_user_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.waiting_list DROP CONSTRAINT IF EXISTS waiting_list_session_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.sessions DROP CONSTRAINT IF EXISTS sessions_trainer_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.sessions DROP CONSTRAINT IF EXISTS sessions_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.session_reviews DROP CONSTRAINT IF EXISTS session_reviews_user_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.session_reviews DROP CONSTRAINT IF EXISTS session_reviews_session_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.session_records DROP CONSTRAINT IF EXISTS session_records_session_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.session_invitees DROP CONSTRAINT IF EXISTS session_invitees_session_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.session_invitees DROP CONSTRAINT IF EXISTS session_invitees_friend_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.invitations DROP CONSTRAINT IF EXISTS invitations_user_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.invitations DROP CONSTRAINT IF EXISTS invitations_session_id_fkey;
ALTER TABLE IF EXISTS ONLY sessions.invitations DROP CONSTRAINT IF EXISTS invitations_friend_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.promo_code_usages DROP CONSTRAINT IF EXISTS promo_code_usages_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.promo_code_usages DROP CONSTRAINT IF EXISTS promo_code_usages_promo_code_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.memberships DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.credits DROP CONSTRAINT IF EXISTS credits_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.credits_history DROP CONSTRAINT IF EXISTS credits_history_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.credits_history DROP CONSTRAINT IF EXISTS credits_history_credits_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_identities DROP CONSTRAINT IF EXISTS user_identities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.security_events DROP CONSTRAINT IF EXISTS security_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.security_events DROP CONSTRAINT IF EXISTS security_events_device_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.stuff DROP CONSTRAINT IF EXISTS stuff_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.inductions DROP CONSTRAINT IF EXISTS inductions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.inductions DROP CONSTRAINT IF EXISTS inductions_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gyms DROP CONSTRAINT IF EXISTS gyms_verified_by_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gyms DROP CONSTRAINT IF EXISTS gyms_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_trainers DROP CONSTRAINT IF EXISTS gym_trainers_user_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_trainers DROP CONSTRAINT IF EXISTS gym_trainers_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_special_prices DROP CONSTRAINT IF EXISTS gym_special_prices_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_reviews DROP CONSTRAINT IF EXISTS gym_reviews_user_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_reviews DROP CONSTRAINT IF EXISTS gym_reviews_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_members DROP CONSTRAINT IF EXISTS gym_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_members DROP CONSTRAINT IF EXISTS gym_members_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_hourly_prices DROP CONSTRAINT IF EXISTS gym_hourly_prices_gym_id_fkey;
ALTER TABLE IF EXISTS ONLY files.file_storage_logs DROP CONSTRAINT IF EXISTS file_storage_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.user_identities DROP CONSTRAINT IF EXISTS user_identities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.security_events DROP CONSTRAINT IF EXISTS security_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.security_events DROP CONSTRAINT IF EXISTS security_events_device_id_fkey;
DROP INDEX IF EXISTS users.users_phone_number_idx;
DROP INDEX IF EXISTS users.users_email_key;
DROP INDEX IF EXISTS users.users_email_idx;
DROP INDEX IF EXISTS users.users_deleted_at_idx;
DROP INDEX IF EXISTS users.users_alias_key;
DROP INDEX IF EXISTS users.professionals_user_id_key;
DROP INDEX IF EXISTS users.professionals_user_id_idx;
DROP INDEX IF EXISTS users.parq_user_id_key;
DROP INDEX IF EXISTS users.parq_user_id_idx;
DROP INDEX IF EXISTS users.friends_user_id_idx;
DROP INDEX IF EXISTS users.friends_user_id_email_key;
DROP INDEX IF EXISTS users.friends_referred_user_id_idx;
DROP INDEX IF EXISTS users.addresses_user_id_idx;
DROP INDEX IF EXISTS support.templates_type_is_active_idx;
DROP INDEX IF EXISTS support.templates_name_key;
DROP INDEX IF EXISTS support.templates_name_idx;
DROP INDEX IF EXISTS support.templates_external_id_key;
DROP INDEX IF EXISTS support.templates_category_idx;
DROP INDEX IF EXISTS support.support_comments_user_id_idx;
DROP INDEX IF EXISTS support.support_comments_problem_id_idx;
DROP INDEX IF EXISTS support.support_comments_created_at_idx;
DROP INDEX IF EXISTS support.problems_user_id_idx;
DROP INDEX IF EXISTS support.problems_type_idx;
DROP INDEX IF EXISTS support.problems_ticket_number_key;
DROP INDEX IF EXISTS support.problems_ticket_number_idx;
DROP INDEX IF EXISTS support.problems_status_idx;
DROP INDEX IF EXISTS support.problems_priority_idx;
DROP INDEX IF EXISTS support.problems_created_at_idx;
DROP INDEX IF EXISTS support.problems_assigned_to_idx;
DROP INDEX IF EXISTS support.notifications_user_id_is_read_idx;
DROP INDEX IF EXISTS support.notifications_user_id_created_at_idx;
DROP INDEX IF EXISTS support.notifications_type_idx;
DROP INDEX IF EXISTS support.communication_logs_user_id_idx;
DROP INDEX IF EXISTS support.communication_logs_type_status_idx;
DROP INDEX IF EXISTS support.communication_logs_template_id_idx;
DROP INDEX IF EXISTS support.communication_logs_recipient_idx;
DROP INDEX IF EXISTS support.communication_logs_created_at_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_user_id_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_status_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_is_public_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_folder_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_file_id_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_created_at_idx;
DROP INDEX IF EXISTS storage.file_storage_logs_content_type_idx;
DROP INDEX IF EXISTS social.social_interactions_user_id_idx;
DROP INDEX IF EXISTS social.social_interactions_user_id_entity_type_entity_id_type_key;
DROP INDEX IF EXISTS social.social_interactions_type_idx;
DROP INDEX IF EXISTS social.social_interactions_entity_type_entity_id_idx;
DROP INDEX IF EXISTS social.follows_following_id_idx;
DROP INDEX IF EXISTS social.follows_following_id_created_at_idx;
DROP INDEX IF EXISTS social.follows_follower_id_idx;
DROP INDEX IF EXISTS social.follows_follower_id_following_id_key;
DROP INDEX IF EXISTS social.follows_follower_id_created_at_idx;
DROP INDEX IF EXISTS social.activities_user_id_idx;
DROP INDEX IF EXISTS social.activities_user_id_created_at_idx;
DROP INDEX IF EXISTS social.activities_type_idx;
DROP INDEX IF EXISTS social.activities_privacy_created_at_idx;
DROP INDEX IF EXISTS social.activities_entity_type_entity_id_idx;
DROP INDEX IF EXISTS social.activities_created_at_idx;
DROP INDEX IF EXISTS sessions.waiting_list_user_id_idx;
DROP INDEX IF EXISTS sessions.waiting_list_session_id_joined_at_idx;
DROP INDEX IF EXISTS sessions.sessions_user_id_idx;
DROP INDEX IF EXISTS sessions.sessions_trainer_id_idx;
DROP INDEX IF EXISTS sessions.sessions_status_idx;
DROP INDEX IF EXISTS sessions.sessions_payment_deadline_idx;
DROP INDEX IF EXISTS sessions.sessions_gym_id_idx;
DROP INDEX IF EXISTS sessions.sessions_date_idx;
DROP INDEX IF EXISTS sessions.session_reviews_user_id_idx;
DROP INDEX IF EXISTS sessions.session_reviews_session_id_user_id_key;
DROP INDEX IF EXISTS sessions.session_reviews_session_id_idx;
DROP INDEX IF EXISTS sessions.session_records_session_id_idx;
DROP INDEX IF EXISTS sessions.session_records_created_at_idx;
DROP INDEX IF EXISTS sessions.session_invitees_session_id_idx;
DROP INDEX IF EXISTS sessions.session_invitees_session_id_friend_id_key;
DROP INDEX IF EXISTS sessions.session_invitees_friend_id_idx;
DROP INDEX IF EXISTS sessions.invitations_user_id_idx;
DROP INDEX IF EXISTS sessions.invitations_session_id_idx;
DROP INDEX IF EXISTS sessions.invitations_guest_email_idx;
DROP INDEX IF EXISTS payments.subscriptions_user_id_idx;
DROP INDEX IF EXISTS payments.subscriptions_stripe_subscription_id_key;
DROP INDEX IF EXISTS payments.subscriptions_stripe_subscription_id_idx;
DROP INDEX IF EXISTS payments.subscriptions_status_idx;
DROP INDEX IF EXISTS payments.subscriptions_plan_type_idx;
DROP INDEX IF EXISTS payments.subscriptions_plan_id_idx;
DROP INDEX IF EXISTS payments.subscription_plans_stripe_product_id_key;
DROP INDEX IF EXISTS payments.subscription_plans_stripe_price_id_key;
DROP INDEX IF EXISTS payments.subscription_plans_name_key;
DROP INDEX IF EXISTS payments.subscription_plans_membership_type_idx;
DROP INDEX IF EXISTS payments.subscription_plans_membership_package_idx;
DROP INDEX IF EXISTS payments.subscription_plans_is_active_idx;
DROP INDEX IF EXISTS payments.subscription_plans_interval_idx;
DROP INDEX IF EXISTS payments.promo_codes_expiration_date_idx;
DROP INDEX IF EXISTS payments.promo_codes_code_key;
DROP INDEX IF EXISTS payments.promo_codes_code_idx;
DROP INDEX IF EXISTS payments.promo_codes_active_idx;
DROP INDEX IF EXISTS payments.promo_code_usages_user_id_idx;
DROP INDEX IF EXISTS payments.promo_code_usages_promo_code_id_idx;
DROP INDEX IF EXISTS payments.memberships_user_id_key;
DROP INDEX IF EXISTS payments.memberships_subscription_status_idx;
DROP INDEX IF EXISTS payments.memberships_stripe_subscription_id_idx;
DROP INDEX IF EXISTS payments.memberships_stripe_customer_id_key;
DROP INDEX IF EXISTS payments.memberships_stripe_customer_id_idx;
DROP INDEX IF EXISTS payments.credits_user_id_key;
DROP INDEX IF EXISTS payments.credits_packs_active_idx;
DROP INDEX IF EXISTS payments.credits_history_user_id_idx;
DROP INDEX IF EXISTS payments.credits_history_date_idx;
DROP INDEX IF EXISTS payments.credits_history_credits_id_idx;
DROP INDEX IF EXISTS identity.user_mfa_settings_user_id_key;
DROP INDEX IF EXISTS identity.user_mfa_settings_user_id_is_enabled_idx;
DROP INDEX IF EXISTS identity.user_mfa_settings_user_id_idx;
DROP INDEX IF EXISTS identity.user_identities_user_id_key;
DROP INDEX IF EXISTS identity.user_identities_user_id_idx;
DROP INDEX IF EXISTS identity.user_identities_provider_provider_id_key;
DROP INDEX IF EXISTS identity.user_identities_provider_provider_id_idx;
DROP INDEX IF EXISTS identity.user_identities_firebase_uid_key;
DROP INDEX IF EXISTS identity.user_identities_firebase_uid_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_last_active_at_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_is_trusted_trust_expires_at_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_device_id_key;
DROP INDEX IF EXISTS identity.user_devices_fcm_token_idx;
DROP INDEX IF EXISTS identity.user_auth_methods_user_id_is_enabled_last_used_at_idx;
DROP INDEX IF EXISTS identity.user_auth_methods_user_id_idx;
DROP INDEX IF EXISTS identity.user_auth_methods_user_id_auth_method_key;
DROP INDEX IF EXISTS identity.user_auth_methods_auth_method_idx;
DROP INDEX IF EXISTS identity.security_events_user_id_idx;
DROP INDEX IF EXISTS identity.security_events_risk_score_created_at_idx;
DROP INDEX IF EXISTS identity.security_events_event_type_idx;
DROP INDEX IF EXISTS identity.security_events_created_at_idx;
DROP INDEX IF EXISTS gyms.gym_trainers_gym_id_user_id_key;
DROP INDEX IF EXISTS gyms.gym_special_prices_gym_id_date_hour_key;
DROP INDEX IF EXISTS gyms.gym_members_gym_id_user_id_key;
DROP INDEX IF EXISTS gyms.gym_hourly_prices_gym_id_day_of_week_hour_key;
DROP INDEX IF EXISTS files.file_storage_logs_user_id_idx;
DROP INDEX IF EXISTS files.file_storage_logs_status_idx;
DROP INDEX IF EXISTS files.file_storage_logs_is_public_idx;
DROP INDEX IF EXISTS files.file_storage_logs_folder_idx;
DROP INDEX IF EXISTS files.file_storage_logs_file_id_idx;
DROP INDEX IF EXISTS files.file_storage_logs_created_at_idx;
DROP INDEX IF EXISTS files.file_storage_logs_content_type_idx;
DROP INDEX IF EXISTS auth.user_mfa_settings_user_id_key;
DROP INDEX IF EXISTS auth.user_mfa_settings_user_id_is_enabled_idx;
DROP INDEX IF EXISTS auth.user_mfa_settings_user_id_idx;
DROP INDEX IF EXISTS auth.user_identities_user_id_key;
DROP INDEX IF EXISTS auth.user_identities_user_id_idx;
DROP INDEX IF EXISTS auth.user_identities_provider_provider_id_key;
DROP INDEX IF EXISTS auth.user_identities_provider_provider_id_idx;
DROP INDEX IF EXISTS auth.user_identities_firebase_uid_key;
DROP INDEX IF EXISTS auth.user_identities_firebase_uid_idx;
DROP INDEX IF EXISTS auth.user_devices_user_id_last_active_at_idx;
DROP INDEX IF EXISTS auth.user_devices_user_id_is_trusted_trust_expires_at_idx;
DROP INDEX IF EXISTS auth.user_devices_user_id_idx;
DROP INDEX IF EXISTS auth.user_devices_user_id_device_id_key;
DROP INDEX IF EXISTS auth.user_devices_fcm_token_idx;
DROP INDEX IF EXISTS auth.user_auth_methods_user_id_is_enabled_last_used_at_idx;
DROP INDEX IF EXISTS auth.user_auth_methods_user_id_idx;
DROP INDEX IF EXISTS auth.user_auth_methods_user_id_auth_method_key;
DROP INDEX IF EXISTS auth.user_auth_methods_auth_method_idx;
DROP INDEX IF EXISTS auth.security_events_user_id_idx;
DROP INDEX IF EXISTS auth.security_events_risk_score_created_at_idx;
DROP INDEX IF EXISTS auth.security_events_event_type_idx;
DROP INDEX IF EXISTS auth.security_events_created_at_idx;
DROP INDEX IF EXISTS audit.audit_logs_user_id_idx;
DROP INDEX IF EXISTS audit.audit_logs_entity_type_entity_id_idx;
DROP INDEX IF EXISTS audit.audit_logs_created_at_idx;
ALTER TABLE IF EXISTS ONLY users.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY users.professionals DROP CONSTRAINT IF EXISTS professionals_pkey;
ALTER TABLE IF EXISTS ONLY users.parq DROP CONSTRAINT IF EXISTS parq_pkey;
ALTER TABLE IF EXISTS ONLY users.friends DROP CONSTRAINT IF EXISTS friends_pkey;
ALTER TABLE IF EXISTS ONLY users.addresses DROP CONSTRAINT IF EXISTS addresses_pkey;
ALTER TABLE IF EXISTS ONLY support.templates DROP CONSTRAINT IF EXISTS templates_pkey;
ALTER TABLE IF EXISTS ONLY support.support_comments DROP CONSTRAINT IF EXISTS support_comments_pkey;
ALTER TABLE IF EXISTS ONLY support.problems DROP CONSTRAINT IF EXISTS problems_pkey;
ALTER TABLE IF EXISTS ONLY support.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY support.communication_logs DROP CONSTRAINT IF EXISTS communication_logs_pkey;
ALTER TABLE IF EXISTS ONLY storage.file_storage_logs DROP CONSTRAINT IF EXISTS file_storage_logs_pkey;
ALTER TABLE IF EXISTS ONLY social.social_interactions DROP CONSTRAINT IF EXISTS social_interactions_pkey;
ALTER TABLE IF EXISTS ONLY social.follows DROP CONSTRAINT IF EXISTS follows_pkey;
ALTER TABLE IF EXISTS ONLY social.activities DROP CONSTRAINT IF EXISTS activities_pkey;
ALTER TABLE IF EXISTS ONLY sessions.waiting_list DROP CONSTRAINT IF EXISTS waiting_list_pkey;
ALTER TABLE IF EXISTS ONLY sessions.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY sessions.session_reviews DROP CONSTRAINT IF EXISTS session_reviews_pkey;
ALTER TABLE IF EXISTS ONLY sessions.session_records DROP CONSTRAINT IF EXISTS session_records_pkey;
ALTER TABLE IF EXISTS ONLY sessions.session_invitees DROP CONSTRAINT IF EXISTS session_invitees_pkey;
ALTER TABLE IF EXISTS ONLY sessions.invitations DROP CONSTRAINT IF EXISTS invitations_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY payments.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY payments.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_pkey;
ALTER TABLE IF EXISTS ONLY payments.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_pkey;
ALTER TABLE IF EXISTS ONLY payments.promo_code_usages DROP CONSTRAINT IF EXISTS promo_code_usages_pkey;
ALTER TABLE IF EXISTS ONLY payments.memberships DROP CONSTRAINT IF EXISTS memberships_pkey;
ALTER TABLE IF EXISTS ONLY payments.credits DROP CONSTRAINT IF EXISTS credits_pkey;
ALTER TABLE IF EXISTS ONLY payments.credits_packs DROP CONSTRAINT IF EXISTS credits_packs_pkey;
ALTER TABLE IF EXISTS ONLY payments.credits_history DROP CONSTRAINT IF EXISTS credits_history_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_identities DROP CONSTRAINT IF EXISTS user_identities_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_devices DROP CONSTRAINT IF EXISTS user_devices_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_pkey;
ALTER TABLE IF EXISTS ONLY identity.security_events DROP CONSTRAINT IF EXISTS security_events_pkey;
ALTER TABLE IF EXISTS ONLY gyms.stuff DROP CONSTRAINT IF EXISTS stuff_pkey;
ALTER TABLE IF EXISTS ONLY gyms.inductions DROP CONSTRAINT IF EXISTS inductions_pkey;
ALTER TABLE IF EXISTS ONLY gyms.gyms DROP CONSTRAINT IF EXISTS gyms_pkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_trainers DROP CONSTRAINT IF EXISTS gym_trainers_pkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_special_prices DROP CONSTRAINT IF EXISTS gym_special_prices_pkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_reviews DROP CONSTRAINT IF EXISTS gym_reviews_pkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_members DROP CONSTRAINT IF EXISTS gym_members_pkey;
ALTER TABLE IF EXISTS ONLY gyms.gym_hourly_prices DROP CONSTRAINT IF EXISTS gym_hourly_prices_pkey;
ALTER TABLE IF EXISTS ONLY files.file_storage_logs DROP CONSTRAINT IF EXISTS file_storage_logs_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_identities DROP CONSTRAINT IF EXISTS user_identities_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_devices DROP CONSTRAINT IF EXISTS user_devices_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_pkey;
ALTER TABLE IF EXISTS ONLY auth.security_events DROP CONSTRAINT IF EXISTS security_events_pkey;
ALTER TABLE IF EXISTS ONLY audit.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
DROP TABLE IF EXISTS users.users;
DROP TABLE IF EXISTS users.professionals;
DROP TABLE IF EXISTS users.parq;
DROP TABLE IF EXISTS users.friends;
DROP TABLE IF EXISTS users.addresses;
DROP TABLE IF EXISTS support.templates;
DROP TABLE IF EXISTS support.support_comments;
DROP TABLE IF EXISTS support.problems;
DROP TABLE IF EXISTS support.notifications;
DROP TABLE IF EXISTS support.communication_logs;
DROP TABLE IF EXISTS storage.file_storage_logs;
DROP TABLE IF EXISTS social.social_interactions;
DROP TABLE IF EXISTS social.follows;
DROP TABLE IF EXISTS social.activities;
DROP TABLE IF EXISTS sessions.waiting_list;
DROP TABLE IF EXISTS sessions.sessions;
DROP TABLE IF EXISTS sessions.session_reviews;
DROP TABLE IF EXISTS sessions.session_records;
DROP TABLE IF EXISTS sessions.session_invitees;
DROP TABLE IF EXISTS sessions.invitations;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS payments.subscriptions;
DROP TABLE IF EXISTS payments.subscription_plans;
DROP TABLE IF EXISTS payments.promo_codes;
DROP TABLE IF EXISTS payments.promo_code_usages;
DROP TABLE IF EXISTS payments.memberships;
DROP TABLE IF EXISTS payments.credits_packs;
DROP TABLE IF EXISTS payments.credits_history;
DROP TABLE IF EXISTS payments.credits;
DROP TABLE IF EXISTS identity.user_mfa_settings;
DROP TABLE IF EXISTS identity.user_identities;
DROP TABLE IF EXISTS identity.user_devices;
DROP TABLE IF EXISTS identity.user_auth_methods;
DROP TABLE IF EXISTS identity.security_events;
DROP TABLE IF EXISTS gyms.stuff;
DROP TABLE IF EXISTS gyms.inductions;
DROP TABLE IF EXISTS gyms.gyms;
DROP TABLE IF EXISTS gyms.gym_trainers;
DROP TABLE IF EXISTS gyms.gym_special_prices;
DROP TABLE IF EXISTS gyms.gym_reviews;
DROP TABLE IF EXISTS gyms.gym_members;
DROP TABLE IF EXISTS gyms.gym_hourly_prices;
DROP TABLE IF EXISTS files.file_storage_logs;
DROP TABLE IF EXISTS auth.user_mfa_settings;
DROP TABLE IF EXISTS auth.user_identities;
DROP TABLE IF EXISTS auth.user_devices;
DROP TABLE IF EXISTS auth.user_auth_methods;
DROP TABLE IF EXISTS auth.security_events;
DROP TABLE IF EXISTS audit.audit_logs;
DROP TYPE IF EXISTS users."FriendStatus";
DROP TYPE IF EXISTS users."FriendOrClientType";
DROP TYPE IF EXISTS support."ProblemType";
DROP TYPE IF EXISTS support."ProblemStatus";
DROP TYPE IF EXISTS support."ProblemPriority";
DROP TYPE IF EXISTS social."PrivacyLevel";
DROP TYPE IF EXISTS social."InteractionType";
DROP TYPE IF EXISTS social."ActivityType";
DROP TYPE IF EXISTS sessions."WaitingListStatus";
DROP TYPE IF EXISTS sessions."TeamSize";
DROP TYPE IF EXISTS sessions."SessionStatus";
DROP TYPE IF EXISTS sessions."SessionRating";
DROP TYPE IF EXISTS sessions."SessionPurpose";
DROP TYPE IF EXISTS sessions."InviteeStatus";
DROP TYPE IF EXISTS sessions."InvitationStatus";
DROP TYPE IF EXISTS identity."UserStatus";
DROP TYPE IF EXISTS identity."UserRole";
DROP TYPE IF EXISTS identity."MfaMethod";
DROP TYPE IF EXISTS identity."DeviceType";
DROP TYPE IF EXISTS gyms."WeekDay";
DROP TYPE IF EXISTS gyms."StuffType";
DROP TYPE IF EXISTS gyms."GymVerificationStatus";
DROP TYPE IF EXISTS gyms."GymTier";
DROP TYPE IF EXISTS gyms."GymSubscriptionStatus";
DROP TYPE IF EXISTS gyms."GymStatus";
DROP TYPE IF EXISTS auth."UserStatus";
DROP TYPE IF EXISTS auth."UserRole";
DROP TYPE IF EXISTS auth."MfaMethod";
DROP TYPE IF EXISTS auth."DeviceType";
DROP TYPE IF EXISTS audit."AuditAction";
DROP EXTENSION IF EXISTS pgcrypto;
DROP SCHEMA IF EXISTS users;
DROP SCHEMA IF EXISTS support;
DROP SCHEMA IF EXISTS storage;
DROP SCHEMA IF EXISTS social;
DROP SCHEMA IF EXISTS sessions;
DROP SCHEMA IF EXISTS payments;
DROP SCHEMA IF EXISTS identity;
DROP SCHEMA IF EXISTS gyms;
DROP SCHEMA IF EXISTS files;
DROP SCHEMA IF EXISTS auth;
DROP SCHEMA IF EXISTS audit;
--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA audit;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: files; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA files;


--
-- Name: gyms; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA gyms;


--
-- Name: identity; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA identity;


--
-- Name: payments; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA payments;


--
-- Name: sessions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA sessions;


--
-- Name: social; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA social;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: support; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA support;


--
-- Name: users; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA users;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: AuditAction; Type: TYPE; Schema: audit; Owner: -
--

CREATE TYPE audit."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'STATUS_CHANGE'
);


--
-- Name: DeviceType; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth."DeviceType" AS ENUM (
    'ios',
    'android',
    'web',
    'desktop'
);


--
-- Name: MfaMethod; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth."MfaMethod" AS ENUM (
    'sms',
    'totp',
    'email',
    'backup_codes'
);


--
-- Name: UserRole; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth."UserRole" AS ENUM (
    'ADMIN',
    'MEMBER',
    'PROFESSIONAL',
    'THERAPIST',
    'CONTENT_CREATOR'
);


--
-- Name: UserStatus; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth."UserStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'BANNED',
    'UNCONFIRMED'
);


--
-- Name: GymStatus; Type: TYPE; Schema: gyms; Owner: -
--

CREATE TYPE gyms."GymStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE',
    'COMING_SOON'
);


--
-- Name: GymSubscriptionStatus; Type: TYPE; Schema: gyms; Owner: -
--

CREATE TYPE gyms."GymSubscriptionStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);


--
-- Name: GymTier; Type: TYPE; Schema: gyms; Owner: -
--

CREATE TYPE gyms."GymTier" AS ENUM (
    'BASIC',
    'STANDARD',
    'PREMIUM',
    'ENTERPRISE'
);


--
-- Name: GymVerificationStatus; Type: TYPE; Schema: gyms; Owner: -
--

CREATE TYPE gyms."GymVerificationStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUSPENDED'
);


--
-- Name: StuffType; Type: TYPE; Schema: gyms; Owner: -
--

CREATE TYPE gyms."StuffType" AS ENUM (
    'EQUIPMENT',
    'AMENITY',
    'FEATURE'
);


--
-- Name: WeekDay; Type: TYPE; Schema: gyms; Owner: -
--

CREATE TYPE gyms."WeekDay" AS ENUM (
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
);


--
-- Name: DeviceType; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."DeviceType" AS ENUM (
    'ios',
    'android',
    'web',
    'desktop'
);


--
-- Name: MfaMethod; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."MfaMethod" AS ENUM (
    'sms',
    'totp',
    'email',
    'backup_codes'
);


--
-- Name: UserRole; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."UserRole" AS ENUM (
    'ADMIN',
    'MEMBER',
    'PROFESSIONAL',
    'THERAPIST',
    'CONTENT_CREATOR'
);


--
-- Name: UserStatus; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."UserStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'BANNED',
    'UNCONFIRMED'
);


--
-- Name: InvitationStatus; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."InvitationStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED'
);


--
-- Name: InviteeStatus; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."InviteeStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'DECLINED'
);


--
-- Name: SessionPurpose; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."SessionPurpose" AS ENUM (
    'WORKING',
    'WORKOUT',
    'CONTENT'
);


--
-- Name: SessionRating; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."SessionRating" AS ENUM (
    'SAD',
    'NEUTRAL',
    'HAPPY'
);


--
-- Name: SessionStatus; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."SessionStatus" AS ENUM (
    'UPCOMING',
    'PENDING_APPROVAL',
    'PAYMENT_PENDING',
    'COMPLETED',
    'CANCELLED',
    'DECLINED'
);


--
-- Name: TeamSize; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."TeamSize" AS ENUM (
    'CREATOR',
    'BRAND',
    'ENTERPRISE'
);


--
-- Name: WaitingListStatus; Type: TYPE; Schema: sessions; Owner: -
--

CREATE TYPE sessions."WaitingListStatus" AS ENUM (
    'WAITING',
    'ACCEPTED',
    'DECLINED',
    'LEFT'
);


--
-- Name: ActivityType; Type: TYPE; Schema: social; Owner: -
--

CREATE TYPE social."ActivityType" AS ENUM (
    'SESSION_BOOKED',
    'SESSION_COMPLETED',
    'SESSION_REVIEWED',
    'FRIEND_ADDED',
    'USER_FOLLOWED',
    'GYM_VISITED',
    'ACHIEVEMENT_EARNED',
    'PROFILE_UPDATED',
    'ENTITY_LIKED',
    'ENTITY_SHARED',
    'ENTITY_COMMENTED',
    'ENTITY_BOOKMARKED'
);


--
-- Name: InteractionType; Type: TYPE; Schema: social; Owner: -
--

CREATE TYPE social."InteractionType" AS ENUM (
    'LIKE',
    'COMMENT',
    'SHARE',
    'BOOKMARK'
);


--
-- Name: PrivacyLevel; Type: TYPE; Schema: social; Owner: -
--

CREATE TYPE social."PrivacyLevel" AS ENUM (
    'PUBLIC',
    'FRIENDS',
    'FOLLOWERS',
    'PRIVATE'
);


--
-- Name: ProblemPriority; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."ProblemPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
    'CRITICAL'
);


--
-- Name: ProblemStatus; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."ProblemStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'ASSIGNED',
    'WAITING_CUSTOMER',
    'WAITING_INTERNAL'
);


--
-- Name: ProblemType; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."ProblemType" AS ENUM (
    'BILLING',
    'TECHNICAL',
    'ACCOUNT',
    'BOOKING',
    'GYM_ISSUE',
    'TRAINER_ISSUE',
    'GENERAL',
    'BUG_REPORT',
    'FEATURE_REQUEST'
);


--
-- Name: FriendOrClientType; Type: TYPE; Schema: users; Owner: -
--

CREATE TYPE users."FriendOrClientType" AS ENUM (
    'FRIEND',
    'CLIENT'
);


--
-- Name: FriendStatus; Type: TYPE; Schema: users; Owner: -
--

CREATE TYPE users."FriendStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'BLOCKED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: audit; Owner: -
--

CREATE TABLE audit.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action audit."AuditAction" NOT NULL,
    user_id uuid,
    data jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: security_events; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    device_id uuid,
    event_type character varying(100) NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet,
    user_agent text,
    location jsonb,
    risk_score integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_auth_methods; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.user_auth_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    auth_method character varying(50) NOT NULL,
    provider_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    last_used_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_devices; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id character varying(255) NOT NULL,
    device_name character varying(255),
    device_type auth."DeviceType" NOT NULL,
    browser_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_ip_address inet,
    last_location jsonb,
    is_trusted boolean DEFAULT false NOT NULL,
    trust_expires_at timestamp(6) with time zone,
    fcm_token character varying(500),
    last_active_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.user_identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    provider_id character varying(255) NOT NULL,
    firebase_uid character varying(128),
    provider_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_sign_in_method character varying(50),
    is_email_verified boolean DEFAULT false NOT NULL,
    is_phone_verified boolean DEFAULT false NOT NULL,
    last_login timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_mfa_settings; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    preferred_method auth."MfaMethod",
    backup_codes_hash text[],
    backup_codes_generated_at timestamp(6) with time zone,
    backup_codes_used integer DEFAULT 0 NOT NULL,
    totp_secret_encrypted text,
    recovery_email character varying(255),
    phone_number_verified character varying(50),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: file_storage_logs; Type: TABLE; Schema: files; Owner: -
--

CREATE TABLE files.file_storage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    content_type character varying(100) NOT NULL,
    size integer NOT NULL,
    folder character varying(255),
    is_public boolean DEFAULT false NOT NULL,
    url text NOT NULL,
    storage_key text,
    status character varying(20) NOT NULL,
    user_id uuid,
    metadata jsonb,
    provider character varying(50),
    uploaded_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    error_message text,
    processing_time_ms integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: gym_hourly_prices; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.gym_hourly_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gym_id uuid NOT NULL,
    hour integer NOT NULL,
    price integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    day_of_week gyms."WeekDay" NOT NULL
);


--
-- Name: gym_members; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.gym_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gym_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


--
-- Name: gym_reviews; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.gym_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gym_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: gym_special_prices; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.gym_special_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gym_id uuid NOT NULL,
    date date NOT NULL,
    hour integer NOT NULL,
    price integer NOT NULL,
    reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: gym_trainers; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.gym_trainers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gym_id uuid NOT NULL,
    user_id uuid NOT NULL,
    start_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date date,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


--
-- Name: gyms; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.gyms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    address text NOT NULL,
    opening_hours text NOT NULL,
    area integer NOT NULL,
    capacity integer NOT NULL,
    price_range text NOT NULL,
    pictures text[] DEFAULT ARRAY[]::text[],
    house_rules text,
    public_transport text,
    parking text,
    is_partner boolean DEFAULT false NOT NULL,
    partner text,
    latitude double precision,
    longitude double precision,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status gyms."GymStatus" DEFAULT 'COMING_SOON'::gyms."GymStatus" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    admin_notes text,
    amenities text[] DEFAULT ARRAY[]::text[],
    bank_account_verified boolean DEFAULT false NOT NULL,
    business_registration_number text,
    city text NOT NULL,
    country text DEFAULT 'UK'::text NOT NULL,
    email text NOT NULL,
    features text[] DEFAULT ARRAY[]::text[],
    last_inspection_date date,
    owner_id uuid,
    phone_number text NOT NULL,
    postal_code text NOT NULL,
    rejection_reason text,
    risk_score integer,
    state text NOT NULL,
    subscription_expires_at timestamp(6) with time zone,
    subscription_status gyms."GymSubscriptionStatus",
    tax_id text,
    tier gyms."GymTier" DEFAULT 'BASIC'::gyms."GymTier" NOT NULL,
    verification_status gyms."GymVerificationStatus" DEFAULT 'PENDING'::gyms."GymVerificationStatus" NOT NULL,
    verified_at timestamp(6) with time zone,
    verified_by uuid,
    website text
);


--
-- Name: inductions; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.inductions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gym_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: stuff; Type: TABLE; Schema: gyms; Owner: -
--

CREATE TABLE gyms.stuff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    type gyms."StuffType" DEFAULT 'EQUIPMENT'::gyms."StuffType" NOT NULL,
    gym_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: security_events; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    device_id uuid,
    event_type character varying(100) NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet,
    user_agent text,
    location jsonb,
    risk_score integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_auth_methods; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_auth_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    auth_method character varying(50) NOT NULL,
    provider_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    last_used_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_devices; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id character varying(255) NOT NULL,
    device_name character varying(255),
    device_type identity."DeviceType" NOT NULL,
    browser_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_ip_address inet,
    last_location jsonb,
    is_trusted boolean DEFAULT false NOT NULL,
    trust_expires_at timestamp(6) with time zone,
    fcm_token character varying(500),
    last_active_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_identities; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    provider_id character varying(255) NOT NULL,
    firebase_uid character varying(128),
    provider_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_sign_in_method character varying(50),
    is_email_verified boolean DEFAULT false NOT NULL,
    is_phone_verified boolean DEFAULT false NOT NULL,
    last_login timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_mfa_settings; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    preferred_method identity."MfaMethod",
    backup_codes_hash text[],
    backup_codes_generated_at timestamp(6) with time zone,
    backup_codes_used integer DEFAULT 0 NOT NULL,
    totp_secret_encrypted text,
    recovery_email character varying(255),
    phone_number_verified character varying(50),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: credits; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount_demand integer DEFAULT 0 NOT NULL,
    amount_sub integer DEFAULT 0 NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: credits_history; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.credits_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credits_id uuid NOT NULL,
    amount integer NOT NULL,
    description text NOT NULL,
    operation text NOT NULL,
    type text DEFAULT 'demand'::text NOT NULL,
    transaction_id text,
    date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: credits_packs; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.credits_packs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    frequency integer NOT NULL,
    price double precision NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone
);


--
-- Name: memberships; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    active boolean DEFAULT true NOT NULL,
    subscription_status text DEFAULT 'inactive'::text NOT NULL,
    plan_type text DEFAULT 'basic'::text NOT NULL,
    subscription_start_date timestamp(6) with time zone,
    subscription_end_date timestamp(6) with time zone,
    last_payment_date timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: promo_code_usages; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.promo_code_usages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    promo_code_id uuid NOT NULL,
    user_id uuid NOT NULL,
    transaction_id text,
    used_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: promo_codes; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.promo_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    discount integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    allowed_times integer NOT NULL,
    amount_available integer NOT NULL,
    expiration_date timestamp(6) with time zone NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cancelled_at timestamp(6) with time zone
);


--
-- Name: subscription_plans; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    "interval" text NOT NULL,
    interval_count integer DEFAULT 1 NOT NULL,
    credits_amount integer NOT NULL,
    trial_period_days integer,
    features text[],
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    stripe_product_id text,
    stripe_price_id text,
    membership_type text,
    membership_package text,
    gym_access_times jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid,
    plan_type text DEFAULT 'basic'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    billing_interval text DEFAULT 'monthly'::text NOT NULL,
    current_period_start timestamp(6) with time zone,
    current_period_end timestamp(6) with time zone,
    trial_end timestamp(6) with time zone,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    start_date timestamp(6) with time zone,
    end_date timestamp(6) with time zone,
    cancelled_at timestamp(6) with time zone,
    last_processed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: invitations; Type: TABLE; Schema: sessions; Owner: -
--

CREATE TABLE sessions.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_id uuid NOT NULL,
    guest_email character varying(255) NOT NULL,
    friend_id uuid,
    status sessions."InvitationStatus" DEFAULT 'PENDING'::sessions."InvitationStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: session_invitees; Type: TABLE; Schema: sessions; Owner: -
--

CREATE TABLE sessions.session_invitees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    status sessions."InviteeStatus" DEFAULT 'PENDING'::sessions."InviteeStatus" NOT NULL,
    invited_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: session_records; Type: TABLE; Schema: sessions; Owner: -
--

CREATE TABLE sessions.session_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    description text NOT NULL,
    modified_by uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: session_reviews; Type: TABLE; Schema: sessions; Owner: -
--

CREATE TABLE sessions.session_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating sessions."SessionRating" NOT NULL,
    reason text,
    image character varying(500),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sessions; Type: TABLE; Schema: sessions; Owner: -
--

CREATE TABLE sessions.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gym_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration integer NOT NULL,
    status sessions."SessionStatus" DEFAULT 'UPCOMING'::sessions."SessionStatus" NOT NULL,
    payment_deadline timestamp(6) with time zone,
    price integer NOT NULL,
    guests text[] DEFAULT ARRAY[]::text[],
    purpose sessions."SessionPurpose" NOT NULL,
    team_size sessions."TeamSize",
    feedback text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    cancelled_at timestamp(6) with time zone,
    trainer_id uuid,
    gym_name character varying(255),
    trainer_name character varying(255)
);


--
-- Name: waiting_list; Type: TABLE; Schema: sessions; Owner: -
--

CREATE TABLE sessions.waiting_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_id uuid NOT NULL,
    status sessions."WaitingListStatus" DEFAULT 'WAITING'::sessions."WaitingListStatus" NOT NULL,
    joined_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activities; Type: TABLE; Schema: social; Owner: -
--

CREATE TABLE social.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type social."ActivityType" NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    metadata jsonb,
    privacy social."PrivacyLevel" DEFAULT 'PUBLIC'::social."PrivacyLevel" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: follows; Type: TABLE; Schema: social; Owner: -
--

CREATE TABLE social.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: social_interactions; Type: TABLE; Schema: social; Owner: -
--

CREATE TABLE social.social_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    type social."InteractionType" NOT NULL,
    content text,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: file_storage_logs; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.file_storage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    content_type character varying(100) NOT NULL,
    size integer NOT NULL,
    folder character varying(255),
    is_public boolean DEFAULT false NOT NULL,
    url text NOT NULL,
    storage_key text,
    status character varying(20) NOT NULL,
    user_id uuid,
    metadata jsonb,
    provider character varying(50),
    uploaded_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    error_message text,
    processing_time_ms integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: communication_logs; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.communication_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(20) NOT NULL,
    recipient character varying(255) NOT NULL,
    subject character varying(255),
    template_id character varying(100),
    status character varying(20) NOT NULL,
    provider character varying(50),
    provider_id character varying(255),
    metadata jsonb,
    sent_at timestamp(6) with time zone,
    delivered_at timestamp(6) with time zone,
    failed_at timestamp(6) with time zone,
    error_message text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp(6) with time zone
);


--
-- Name: problems; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.problems (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    status support."ProblemStatus" DEFAULT 'OPEN'::support."ProblemStatus" NOT NULL,
    priority support."ProblemPriority" DEFAULT 'MEDIUM'::support."ProblemPriority" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp(6) with time zone,
    assigned_to uuid,
    files text[] DEFAULT ARRAY[]::text[],
    ticket_number character varying(20),
    type support."ProblemType" DEFAULT 'GENERAL'::support."ProblemType" NOT NULL
);


--
-- Name: support_comments; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.support_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    problem_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: templates; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    category character varying(50),
    external_id character varying(255) NOT NULL,
    subject character varying(255),
    body text NOT NULL,
    description text,
    variables jsonb,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: addresses; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country character varying(100) DEFAULT 'United States'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: friends; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.friends (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    avatar_url character varying(1000),
    type users."FriendOrClientType" DEFAULT 'FRIEND'::users."FriendOrClientType" NOT NULL,
    status users."FriendStatus" DEFAULT 'PENDING'::users."FriendStatus" NOT NULL,
    invited_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referred_user_id uuid,
    message text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: parq; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.parq (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    medical_clearance boolean NOT NULL,
    existing_injuries boolean NOT NULL,
    symptoms_check boolean NOT NULL,
    doctor_consultation boolean NOT NULL,
    experience_level boolean NOT NULL,
    proper_technique boolean NOT NULL,
    gym_etiquette boolean NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: professionals; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.professionals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    description text NOT NULL,
    specialties text[] DEFAULT ARRAY[]::text[],
    favorite_gyms text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    password text,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone_number character varying(50),
    phone_verified boolean DEFAULT false NOT NULL,
    avatar_url character varying(1000),
    last_login_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone,
    date_of_birth date,
    alias character varying(50),
    app_version character varying(20),
    active_membership boolean DEFAULT false NOT NULL,
    guests text[] DEFAULT ARRAY[]::text[],
    stripe_user_id character varying(255),
    role identity."UserRole" DEFAULT 'ADMIN'::identity."UserRole" NOT NULL,
    status identity."UserStatus" DEFAULT 'ACTIVE'::identity."UserStatus" NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: user_auth_methods user_auth_methods_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_auth_methods
    ADD CONSTRAINT user_auth_methods_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_identities user_identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_identities
    ADD CONSTRAINT user_identities_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: file_storage_logs file_storage_logs_pkey; Type: CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.file_storage_logs
    ADD CONSTRAINT file_storage_logs_pkey PRIMARY KEY (id);


--
-- Name: gym_hourly_prices gym_hourly_prices_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_hourly_prices
    ADD CONSTRAINT gym_hourly_prices_pkey PRIMARY KEY (id);


--
-- Name: gym_members gym_members_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_members
    ADD CONSTRAINT gym_members_pkey PRIMARY KEY (id);


--
-- Name: gym_reviews gym_reviews_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_reviews
    ADD CONSTRAINT gym_reviews_pkey PRIMARY KEY (id);


--
-- Name: gym_special_prices gym_special_prices_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_special_prices
    ADD CONSTRAINT gym_special_prices_pkey PRIMARY KEY (id);


--
-- Name: gym_trainers gym_trainers_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_trainers
    ADD CONSTRAINT gym_trainers_pkey PRIMARY KEY (id);


--
-- Name: gyms gyms_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gyms
    ADD CONSTRAINT gyms_pkey PRIMARY KEY (id);


--
-- Name: inductions inductions_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.inductions
    ADD CONSTRAINT inductions_pkey PRIMARY KEY (id);


--
-- Name: stuff stuff_pkey; Type: CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.stuff
    ADD CONSTRAINT stuff_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: user_auth_methods user_auth_methods_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_auth_methods
    ADD CONSTRAINT user_auth_methods_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_identities user_identities_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_identities
    ADD CONSTRAINT user_identities_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: credits_history credits_history_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.credits_history
    ADD CONSTRAINT credits_history_pkey PRIMARY KEY (id);


--
-- Name: credits_packs credits_packs_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.credits_packs
    ADD CONSTRAINT credits_packs_pkey PRIMARY KEY (id);


--
-- Name: credits credits_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.credits
    ADD CONSTRAINT credits_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: promo_code_usages promo_code_usages_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.promo_code_usages
    ADD CONSTRAINT promo_code_usages_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: session_invitees session_invitees_pkey; Type: CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_invitees
    ADD CONSTRAINT session_invitees_pkey PRIMARY KEY (id);


--
-- Name: session_records session_records_pkey; Type: CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_records
    ADD CONSTRAINT session_records_pkey PRIMARY KEY (id);


--
-- Name: session_reviews session_reviews_pkey; Type: CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_reviews
    ADD CONSTRAINT session_reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: waiting_list waiting_list_pkey; Type: CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.waiting_list
    ADD CONSTRAINT waiting_list_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: social_interactions social_interactions_pkey; Type: CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.social_interactions
    ADD CONSTRAINT social_interactions_pkey PRIMARY KEY (id);


--
-- Name: file_storage_logs file_storage_logs_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.file_storage_logs
    ADD CONSTRAINT file_storage_logs_pkey PRIMARY KEY (id);


--
-- Name: communication_logs communication_logs_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.communication_logs
    ADD CONSTRAINT communication_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: support_comments support_comments_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.support_comments
    ADD CONSTRAINT support_comments_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (id);


--
-- Name: parq parq_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.parq
    ADD CONSTRAINT parq_pkey PRIMARY KEY (id);


--
-- Name: professionals professionals_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.professionals
    ADD CONSTRAINT professionals_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON audit.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_type_entity_id_idx; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX audit_logs_entity_type_entity_id_idx ON audit.audit_logs USING btree (entity_type, entity_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON audit.audit_logs USING btree (user_id);


--
-- Name: security_events_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX security_events_created_at_idx ON auth.security_events USING btree (created_at);


--
-- Name: security_events_event_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX security_events_event_type_idx ON auth.security_events USING btree (event_type);


--
-- Name: security_events_risk_score_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX security_events_risk_score_created_at_idx ON auth.security_events USING btree (risk_score, created_at);


--
-- Name: security_events_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX security_events_user_id_idx ON auth.security_events USING btree (user_id);


--
-- Name: user_auth_methods_auth_method_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_auth_methods_auth_method_idx ON auth.user_auth_methods USING btree (auth_method);


--
-- Name: user_auth_methods_user_id_auth_method_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX user_auth_methods_user_id_auth_method_key ON auth.user_auth_methods USING btree (user_id, auth_method);


--
-- Name: user_auth_methods_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_auth_methods_user_id_idx ON auth.user_auth_methods USING btree (user_id);


--
-- Name: user_auth_methods_user_id_is_enabled_last_used_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_auth_methods_user_id_is_enabled_last_used_at_idx ON auth.user_auth_methods USING btree (user_id, is_enabled, last_used_at);


--
-- Name: user_devices_fcm_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_devices_fcm_token_idx ON auth.user_devices USING btree (fcm_token);


--
-- Name: user_devices_user_id_device_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX user_devices_user_id_device_id_key ON auth.user_devices USING btree (user_id, device_id);


--
-- Name: user_devices_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_devices_user_id_idx ON auth.user_devices USING btree (user_id);


--
-- Name: user_devices_user_id_is_trusted_trust_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_devices_user_id_is_trusted_trust_expires_at_idx ON auth.user_devices USING btree (user_id, is_trusted, trust_expires_at);


--
-- Name: user_devices_user_id_last_active_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_devices_user_id_last_active_at_idx ON auth.user_devices USING btree (user_id, last_active_at);


--
-- Name: user_identities_firebase_uid_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_identities_firebase_uid_idx ON auth.user_identities USING btree (firebase_uid);


--
-- Name: user_identities_firebase_uid_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX user_identities_firebase_uid_key ON auth.user_identities USING btree (firebase_uid);


--
-- Name: user_identities_provider_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_identities_provider_provider_id_idx ON auth.user_identities USING btree (provider, provider_id);


--
-- Name: user_identities_provider_provider_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX user_identities_provider_provider_id_key ON auth.user_identities USING btree (provider, provider_id);


--
-- Name: user_identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_identities_user_id_idx ON auth.user_identities USING btree (user_id);


--
-- Name: user_identities_user_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX user_identities_user_id_key ON auth.user_identities USING btree (user_id);


--
-- Name: user_mfa_settings_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_mfa_settings_user_id_idx ON auth.user_mfa_settings USING btree (user_id);


--
-- Name: user_mfa_settings_user_id_is_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_mfa_settings_user_id_is_enabled_idx ON auth.user_mfa_settings USING btree (user_id, is_enabled);


--
-- Name: user_mfa_settings_user_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX user_mfa_settings_user_id_key ON auth.user_mfa_settings USING btree (user_id);


--
-- Name: file_storage_logs_content_type_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_content_type_idx ON files.file_storage_logs USING btree (content_type);


--
-- Name: file_storage_logs_created_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_created_at_idx ON files.file_storage_logs USING btree (created_at);


--
-- Name: file_storage_logs_file_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_file_id_idx ON files.file_storage_logs USING btree (file_id);


--
-- Name: file_storage_logs_folder_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_folder_idx ON files.file_storage_logs USING btree (folder);


--
-- Name: file_storage_logs_is_public_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_is_public_idx ON files.file_storage_logs USING btree (is_public);


--
-- Name: file_storage_logs_status_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_status_idx ON files.file_storage_logs USING btree (status);


--
-- Name: file_storage_logs_user_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_user_id_idx ON files.file_storage_logs USING btree (user_id);


--
-- Name: gym_hourly_prices_gym_id_day_of_week_hour_key; Type: INDEX; Schema: gyms; Owner: -
--

CREATE UNIQUE INDEX gym_hourly_prices_gym_id_day_of_week_hour_key ON gyms.gym_hourly_prices USING btree (gym_id, day_of_week, hour);


--
-- Name: gym_members_gym_id_user_id_key; Type: INDEX; Schema: gyms; Owner: -
--

CREATE UNIQUE INDEX gym_members_gym_id_user_id_key ON gyms.gym_members USING btree (gym_id, user_id);


--
-- Name: gym_special_prices_gym_id_date_hour_key; Type: INDEX; Schema: gyms; Owner: -
--

CREATE UNIQUE INDEX gym_special_prices_gym_id_date_hour_key ON gyms.gym_special_prices USING btree (gym_id, date, hour);


--
-- Name: gym_trainers_gym_id_user_id_key; Type: INDEX; Schema: gyms; Owner: -
--

CREATE UNIQUE INDEX gym_trainers_gym_id_user_id_key ON gyms.gym_trainers USING btree (gym_id, user_id);


--
-- Name: security_events_created_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_created_at_idx ON identity.security_events USING btree (created_at);


--
-- Name: security_events_event_type_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_event_type_idx ON identity.security_events USING btree (event_type);


--
-- Name: security_events_risk_score_created_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_risk_score_created_at_idx ON identity.security_events USING btree (risk_score, created_at);


--
-- Name: security_events_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_user_id_idx ON identity.security_events USING btree (user_id);


--
-- Name: user_auth_methods_auth_method_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_auth_methods_auth_method_idx ON identity.user_auth_methods USING btree (auth_method);


--
-- Name: user_auth_methods_user_id_auth_method_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_auth_methods_user_id_auth_method_key ON identity.user_auth_methods USING btree (user_id, auth_method);


--
-- Name: user_auth_methods_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_auth_methods_user_id_idx ON identity.user_auth_methods USING btree (user_id);


--
-- Name: user_auth_methods_user_id_is_enabled_last_used_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_auth_methods_user_id_is_enabled_last_used_at_idx ON identity.user_auth_methods USING btree (user_id, is_enabled, last_used_at);


--
-- Name: user_devices_fcm_token_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_fcm_token_idx ON identity.user_devices USING btree (fcm_token);


--
-- Name: user_devices_user_id_device_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_devices_user_id_device_id_key ON identity.user_devices USING btree (user_id, device_id);


--
-- Name: user_devices_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_user_id_idx ON identity.user_devices USING btree (user_id);


--
-- Name: user_devices_user_id_is_trusted_trust_expires_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_user_id_is_trusted_trust_expires_at_idx ON identity.user_devices USING btree (user_id, is_trusted, trust_expires_at);


--
-- Name: user_devices_user_id_last_active_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_user_id_last_active_at_idx ON identity.user_devices USING btree (user_id, last_active_at);


--
-- Name: user_identities_firebase_uid_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_identities_firebase_uid_idx ON identity.user_identities USING btree (firebase_uid);


--
-- Name: user_identities_firebase_uid_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_identities_firebase_uid_key ON identity.user_identities USING btree (firebase_uid);


--
-- Name: user_identities_provider_provider_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_identities_provider_provider_id_idx ON identity.user_identities USING btree (provider, provider_id);


--
-- Name: user_identities_provider_provider_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_identities_provider_provider_id_key ON identity.user_identities USING btree (provider, provider_id);


--
-- Name: user_identities_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_identities_user_id_idx ON identity.user_identities USING btree (user_id);


--
-- Name: user_identities_user_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_identities_user_id_key ON identity.user_identities USING btree (user_id);


--
-- Name: user_mfa_settings_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_mfa_settings_user_id_idx ON identity.user_mfa_settings USING btree (user_id);


--
-- Name: user_mfa_settings_user_id_is_enabled_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_mfa_settings_user_id_is_enabled_idx ON identity.user_mfa_settings USING btree (user_id, is_enabled);


--
-- Name: user_mfa_settings_user_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_mfa_settings_user_id_key ON identity.user_mfa_settings USING btree (user_id);


--
-- Name: credits_history_credits_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX credits_history_credits_id_idx ON payments.credits_history USING btree (credits_id);


--
-- Name: credits_history_date_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX credits_history_date_idx ON payments.credits_history USING btree (date);


--
-- Name: credits_history_user_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX credits_history_user_id_idx ON payments.credits_history USING btree (user_id);


--
-- Name: credits_packs_active_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX credits_packs_active_idx ON payments.credits_packs USING btree (active);


--
-- Name: credits_user_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX credits_user_id_key ON payments.credits USING btree (user_id);


--
-- Name: memberships_stripe_customer_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX memberships_stripe_customer_id_idx ON payments.memberships USING btree (stripe_customer_id);


--
-- Name: memberships_stripe_customer_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX memberships_stripe_customer_id_key ON payments.memberships USING btree (stripe_customer_id);


--
-- Name: memberships_stripe_subscription_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX memberships_stripe_subscription_id_idx ON payments.memberships USING btree (stripe_subscription_id);


--
-- Name: memberships_subscription_status_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX memberships_subscription_status_idx ON payments.memberships USING btree (subscription_status);


--
-- Name: memberships_user_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX memberships_user_id_key ON payments.memberships USING btree (user_id);


--
-- Name: promo_code_usages_promo_code_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX promo_code_usages_promo_code_id_idx ON payments.promo_code_usages USING btree (promo_code_id);


--
-- Name: promo_code_usages_user_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX promo_code_usages_user_id_idx ON payments.promo_code_usages USING btree (user_id);


--
-- Name: promo_codes_active_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX promo_codes_active_idx ON payments.promo_codes USING btree (active);


--
-- Name: promo_codes_code_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX promo_codes_code_idx ON payments.promo_codes USING btree (code);


--
-- Name: promo_codes_code_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX promo_codes_code_key ON payments.promo_codes USING btree (code);


--
-- Name: promo_codes_expiration_date_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX promo_codes_expiration_date_idx ON payments.promo_codes USING btree (expiration_date);


--
-- Name: subscription_plans_interval_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscription_plans_interval_idx ON payments.subscription_plans USING btree ("interval");


--
-- Name: subscription_plans_is_active_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscription_plans_is_active_idx ON payments.subscription_plans USING btree (is_active);


--
-- Name: subscription_plans_membership_package_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscription_plans_membership_package_idx ON payments.subscription_plans USING btree (membership_package);


--
-- Name: subscription_plans_membership_type_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscription_plans_membership_type_idx ON payments.subscription_plans USING btree (membership_type);


--
-- Name: subscription_plans_name_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscription_plans_name_key ON payments.subscription_plans USING btree (name);


--
-- Name: subscription_plans_stripe_price_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscription_plans_stripe_price_id_key ON payments.subscription_plans USING btree (stripe_price_id);


--
-- Name: subscription_plans_stripe_product_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscription_plans_stripe_product_id_key ON payments.subscription_plans USING btree (stripe_product_id);


--
-- Name: subscriptions_plan_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_plan_id_idx ON payments.subscriptions USING btree (plan_id);


--
-- Name: subscriptions_plan_type_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_plan_type_idx ON payments.subscriptions USING btree (plan_type);


--
-- Name: subscriptions_status_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_status_idx ON payments.subscriptions USING btree (status);


--
-- Name: subscriptions_stripe_subscription_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_stripe_subscription_id_idx ON payments.subscriptions USING btree (stripe_subscription_id);


--
-- Name: subscriptions_stripe_subscription_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscriptions_stripe_subscription_id_key ON payments.subscriptions USING btree (stripe_subscription_id);


--
-- Name: subscriptions_user_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_user_id_idx ON payments.subscriptions USING btree (user_id);


--
-- Name: invitations_guest_email_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX invitations_guest_email_idx ON sessions.invitations USING btree (guest_email);


--
-- Name: invitations_session_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX invitations_session_id_idx ON sessions.invitations USING btree (session_id);


--
-- Name: invitations_user_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX invitations_user_id_idx ON sessions.invitations USING btree (user_id);


--
-- Name: session_invitees_friend_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX session_invitees_friend_id_idx ON sessions.session_invitees USING btree (friend_id);


--
-- Name: session_invitees_session_id_friend_id_key; Type: INDEX; Schema: sessions; Owner: -
--

CREATE UNIQUE INDEX session_invitees_session_id_friend_id_key ON sessions.session_invitees USING btree (session_id, friend_id);


--
-- Name: session_invitees_session_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX session_invitees_session_id_idx ON sessions.session_invitees USING btree (session_id);


--
-- Name: session_records_created_at_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX session_records_created_at_idx ON sessions.session_records USING btree (created_at);


--
-- Name: session_records_session_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX session_records_session_id_idx ON sessions.session_records USING btree (session_id);


--
-- Name: session_reviews_session_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX session_reviews_session_id_idx ON sessions.session_reviews USING btree (session_id);


--
-- Name: session_reviews_session_id_user_id_key; Type: INDEX; Schema: sessions; Owner: -
--

CREATE UNIQUE INDEX session_reviews_session_id_user_id_key ON sessions.session_reviews USING btree (session_id, user_id);


--
-- Name: session_reviews_user_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX session_reviews_user_id_idx ON sessions.session_reviews USING btree (user_id);


--
-- Name: sessions_date_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX sessions_date_idx ON sessions.sessions USING btree (date);


--
-- Name: sessions_gym_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX sessions_gym_id_idx ON sessions.sessions USING btree (gym_id);


--
-- Name: sessions_payment_deadline_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX sessions_payment_deadline_idx ON sessions.sessions USING btree (payment_deadline);


--
-- Name: sessions_status_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX sessions_status_idx ON sessions.sessions USING btree (status);


--
-- Name: sessions_trainer_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX sessions_trainer_id_idx ON sessions.sessions USING btree (trainer_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX sessions_user_id_idx ON sessions.sessions USING btree (user_id);


--
-- Name: waiting_list_session_id_joined_at_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX waiting_list_session_id_joined_at_idx ON sessions.waiting_list USING btree (session_id, joined_at);


--
-- Name: waiting_list_user_id_idx; Type: INDEX; Schema: sessions; Owner: -
--

CREATE INDEX waiting_list_user_id_idx ON sessions.waiting_list USING btree (user_id);


--
-- Name: activities_created_at_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX activities_created_at_idx ON social.activities USING btree (created_at);


--
-- Name: activities_entity_type_entity_id_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX activities_entity_type_entity_id_idx ON social.activities USING btree (entity_type, entity_id);


--
-- Name: activities_privacy_created_at_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX activities_privacy_created_at_idx ON social.activities USING btree (privacy, created_at DESC);


--
-- Name: activities_type_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX activities_type_idx ON social.activities USING btree (type);


--
-- Name: activities_user_id_created_at_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX activities_user_id_created_at_idx ON social.activities USING btree (user_id, created_at DESC);


--
-- Name: activities_user_id_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX activities_user_id_idx ON social.activities USING btree (user_id);


--
-- Name: follows_follower_id_created_at_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX follows_follower_id_created_at_idx ON social.follows USING btree (follower_id, created_at DESC);


--
-- Name: follows_follower_id_following_id_key; Type: INDEX; Schema: social; Owner: -
--

CREATE UNIQUE INDEX follows_follower_id_following_id_key ON social.follows USING btree (follower_id, following_id);


--
-- Name: follows_follower_id_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX follows_follower_id_idx ON social.follows USING btree (follower_id);


--
-- Name: follows_following_id_created_at_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX follows_following_id_created_at_idx ON social.follows USING btree (following_id, created_at DESC);


--
-- Name: follows_following_id_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX follows_following_id_idx ON social.follows USING btree (following_id);


--
-- Name: social_interactions_entity_type_entity_id_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX social_interactions_entity_type_entity_id_idx ON social.social_interactions USING btree (entity_type, entity_id);


--
-- Name: social_interactions_type_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX social_interactions_type_idx ON social.social_interactions USING btree (type);


--
-- Name: social_interactions_user_id_entity_type_entity_id_type_key; Type: INDEX; Schema: social; Owner: -
--

CREATE UNIQUE INDEX social_interactions_user_id_entity_type_entity_id_type_key ON social.social_interactions USING btree (user_id, entity_type, entity_id, type);


--
-- Name: social_interactions_user_id_idx; Type: INDEX; Schema: social; Owner: -
--

CREATE INDEX social_interactions_user_id_idx ON social.social_interactions USING btree (user_id);


--
-- Name: file_storage_logs_content_type_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_content_type_idx ON storage.file_storage_logs USING btree (content_type);


--
-- Name: file_storage_logs_created_at_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_created_at_idx ON storage.file_storage_logs USING btree (created_at);


--
-- Name: file_storage_logs_file_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_file_id_idx ON storage.file_storage_logs USING btree (file_id);


--
-- Name: file_storage_logs_folder_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_folder_idx ON storage.file_storage_logs USING btree (folder);


--
-- Name: file_storage_logs_is_public_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_is_public_idx ON storage.file_storage_logs USING btree (is_public);


--
-- Name: file_storage_logs_status_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_status_idx ON storage.file_storage_logs USING btree (status);


--
-- Name: file_storage_logs_user_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX file_storage_logs_user_id_idx ON storage.file_storage_logs USING btree (user_id);


--
-- Name: communication_logs_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_created_at_idx ON support.communication_logs USING btree (created_at);


--
-- Name: communication_logs_recipient_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_recipient_idx ON support.communication_logs USING btree (recipient);


--
-- Name: communication_logs_template_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_template_id_idx ON support.communication_logs USING btree (template_id);


--
-- Name: communication_logs_type_status_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_type_status_idx ON support.communication_logs USING btree (type, status);


--
-- Name: communication_logs_user_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_user_id_idx ON support.communication_logs USING btree (user_id);


--
-- Name: notifications_type_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX notifications_type_idx ON support.notifications USING btree (type);


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX notifications_user_id_created_at_idx ON support.notifications USING btree (user_id, created_at);


--
-- Name: notifications_user_id_is_read_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX notifications_user_id_is_read_idx ON support.notifications USING btree (user_id, is_read);


--
-- Name: problems_assigned_to_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_assigned_to_idx ON support.problems USING btree (assigned_to);


--
-- Name: problems_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_created_at_idx ON support.problems USING btree (created_at);


--
-- Name: problems_priority_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_priority_idx ON support.problems USING btree (priority);


--
-- Name: problems_status_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_status_idx ON support.problems USING btree (status);


--
-- Name: problems_ticket_number_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_ticket_number_idx ON support.problems USING btree (ticket_number);


--
-- Name: problems_ticket_number_key; Type: INDEX; Schema: support; Owner: -
--

CREATE UNIQUE INDEX problems_ticket_number_key ON support.problems USING btree (ticket_number);


--
-- Name: problems_type_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_type_idx ON support.problems USING btree (type);


--
-- Name: problems_user_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_user_id_idx ON support.problems USING btree (user_id);


--
-- Name: support_comments_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX support_comments_created_at_idx ON support.support_comments USING btree (created_at);


--
-- Name: support_comments_problem_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX support_comments_problem_id_idx ON support.support_comments USING btree (problem_id);


--
-- Name: support_comments_user_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX support_comments_user_id_idx ON support.support_comments USING btree (user_id);


--
-- Name: templates_category_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX templates_category_idx ON support.templates USING btree (category);


--
-- Name: templates_external_id_key; Type: INDEX; Schema: support; Owner: -
--

CREATE UNIQUE INDEX templates_external_id_key ON support.templates USING btree (external_id);


--
-- Name: templates_name_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX templates_name_idx ON support.templates USING btree (name);


--
-- Name: templates_name_key; Type: INDEX; Schema: support; Owner: -
--

CREATE UNIQUE INDEX templates_name_key ON support.templates USING btree (name);


--
-- Name: templates_type_is_active_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX templates_type_is_active_idx ON support.templates USING btree (type, is_active);


--
-- Name: addresses_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX addresses_user_id_idx ON users.addresses USING btree (user_id);


--
-- Name: friends_referred_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX friends_referred_user_id_idx ON users.friends USING btree (referred_user_id);


--
-- Name: friends_user_id_email_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX friends_user_id_email_key ON users.friends USING btree (user_id, email);


--
-- Name: friends_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX friends_user_id_idx ON users.friends USING btree (user_id);


--
-- Name: parq_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX parq_user_id_idx ON users.parq USING btree (user_id);


--
-- Name: parq_user_id_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX parq_user_id_key ON users.parq USING btree (user_id);


--
-- Name: professionals_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX professionals_user_id_idx ON users.professionals USING btree (user_id);


--
-- Name: professionals_user_id_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX professionals_user_id_key ON users.professionals USING btree (user_id);


--
-- Name: users_alias_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX users_alias_key ON users.users USING btree (alias);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX users_deleted_at_idx ON users.users USING btree (deleted_at);


--
-- Name: users_email_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX users_email_idx ON users.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON users.users USING btree (email);


--
-- Name: users_phone_number_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX users_phone_number_idx ON users.users USING btree (phone_number);


--
-- Name: security_events security_events_device_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.security_events
    ADD CONSTRAINT security_events_device_id_fkey FOREIGN KEY (device_id) REFERENCES auth.user_devices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_events security_events_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_auth_methods user_auth_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_auth_methods
    ADD CONSTRAINT user_auth_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_identities user_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_identities
    ADD CONSTRAINT user_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_mfa_settings user_mfa_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_storage_logs file_storage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.file_storage_logs
    ADD CONSTRAINT file_storage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gym_hourly_prices gym_hourly_prices_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_hourly_prices
    ADD CONSTRAINT gym_hourly_prices_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_members gym_members_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_members
    ADD CONSTRAINT gym_members_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_members gym_members_user_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_members
    ADD CONSTRAINT gym_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_reviews gym_reviews_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_reviews
    ADD CONSTRAINT gym_reviews_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_reviews gym_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_reviews
    ADD CONSTRAINT gym_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_special_prices gym_special_prices_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_special_prices
    ADD CONSTRAINT gym_special_prices_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_trainers gym_trainers_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_trainers
    ADD CONSTRAINT gym_trainers_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gym_trainers gym_trainers_user_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gym_trainers
    ADD CONSTRAINT gym_trainers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gyms gyms_owner_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gyms
    ADD CONSTRAINT gyms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gyms gyms_verified_by_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.gyms
    ADD CONSTRAINT gyms_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inductions inductions_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.inductions
    ADD CONSTRAINT inductions_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inductions inductions_user_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.inductions
    ADD CONSTRAINT inductions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stuff stuff_gym_id_fkey; Type: FK CONSTRAINT; Schema: gyms; Owner: -
--

ALTER TABLE ONLY gyms.stuff
    ADD CONSTRAINT stuff_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_events security_events_device_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.security_events
    ADD CONSTRAINT security_events_device_id_fkey FOREIGN KEY (device_id) REFERENCES identity.user_devices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_events security_events_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_auth_methods user_auth_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_auth_methods
    ADD CONSTRAINT user_auth_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_identities user_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_identities
    ADD CONSTRAINT user_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_mfa_settings user_mfa_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credits_history credits_history_credits_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.credits_history
    ADD CONSTRAINT credits_history_credits_id_fkey FOREIGN KEY (credits_id) REFERENCES payments.credits(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credits_history credits_history_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.credits_history
    ADD CONSTRAINT credits_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credits credits_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.credits
    ADD CONSTRAINT credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberships memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.memberships
    ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promo_code_usages promo_code_usages_promo_code_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.promo_code_usages
    ADD CONSTRAINT promo_code_usages_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES payments.promo_codes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promo_code_usages promo_code_usages_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.promo_code_usages
    ADD CONSTRAINT promo_code_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES payments.subscription_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invitations invitations_friend_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.invitations
    ADD CONSTRAINT invitations_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES users.friends(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invitations invitations_session_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.invitations
    ADD CONSTRAINT invitations_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invitations invitations_user_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.invitations
    ADD CONSTRAINT invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_invitees session_invitees_friend_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_invitees
    ADD CONSTRAINT session_invitees_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES users.friends(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_invitees session_invitees_session_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_invitees
    ADD CONSTRAINT session_invitees_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_records session_records_session_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_records
    ADD CONSTRAINT session_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_reviews session_reviews_session_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_reviews
    ADD CONSTRAINT session_reviews_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_reviews session_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.session_reviews
    ADD CONSTRAINT session_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_gym_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.sessions
    ADD CONSTRAINT sessions_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES gyms.gyms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_trainer_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.sessions
    ADD CONSTRAINT sessions_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waiting_list waiting_list_session_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.waiting_list
    ADD CONSTRAINT waiting_list_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waiting_list waiting_list_user_id_fkey; Type: FK CONSTRAINT; Schema: sessions; Owner: -
--

ALTER TABLE ONLY sessions.waiting_list
    ADD CONSTRAINT waiting_list_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: social_interactions social_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: social; Owner: -
--

ALTER TABLE ONLY social.social_interactions
    ADD CONSTRAINT social_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_storage_logs file_storage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.file_storage_logs
    ADD CONSTRAINT file_storage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: communication_logs communication_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.communication_logs
    ADD CONSTRAINT communication_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: problems problems_assigned_to_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.problems
    ADD CONSTRAINT problems_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: problems problems_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.problems
    ADD CONSTRAINT problems_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_comments support_comments_problem_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.support_comments
    ADD CONSTRAINT support_comments_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES support.problems(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_comments support_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.support_comments
    ADD CONSTRAINT support_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: friends friends_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.friends
    ADD CONSTRAINT friends_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: friends friends_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.friends
    ADD CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parq parq_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.parq
    ADD CONSTRAINT parq_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: professionals professionals_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.professionals
    ADD CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

