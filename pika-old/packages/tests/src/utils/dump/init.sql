--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg110+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

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

ALTER TABLE IF EXISTS ONLY users.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE IF EXISTS ONLY users.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.payments DROP CONSTRAINT IF EXISTS payments_payment_method_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.vouchers DROP CONSTRAINT IF EXISTS vouchers_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.vouchers DROP CONSTRAINT IF EXISTS vouchers_category_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_user_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_redemptions DROP CONSTRAINT IF EXISTS voucher_redemptions_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_redemptions DROP CONSTRAINT IF EXISTS voucher_redemptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_codes DROP CONSTRAINT IF EXISTS voucher_codes_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_books DROP CONSTRAINT IF EXISTS voucher_books_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_books DROP CONSTRAINT IF EXISTS voucher_books_created_by_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_book_pages DROP CONSTRAINT IF EXISTS voucher_book_pages_book_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.reviews DROP CONSTRAINT IF EXISTS reviews_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.providers DROP CONSTRAINT IF EXISTS providers_user_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.providers DROP CONSTRAINT IF EXISTS providers_category_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_redemption_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_case_history DROP CONSTRAINT IF EXISTS fraud_case_history_performed_by_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_case_history DROP CONSTRAINT IF EXISTS fraud_case_history_fraud_case_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.customer_vouchers DROP CONSTRAINT IF EXISTS customer_vouchers_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.customer_vouchers DROP CONSTRAINT IF EXISTS customer_vouchers_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.campaigns DROP CONSTRAINT IF EXISTS campaigns_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.book_distributions DROP CONSTRAINT IF EXISTS book_distributions_book_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.availability DROP CONSTRAINT IF EXISTS availability_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_page_id_fkey;
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
DROP INDEX IF EXISTS users.customers_user_id_key;
DROP INDEX IF EXISTS users.addresses_user_id_idx;
DROP INDEX IF EXISTS users.addresses_location_idx;
DROP INDEX IF EXISTS payments.payments_status_idx;
DROP INDEX IF EXISTS payments.payments_external_reference_idx;
DROP INDEX IF EXISTS payments.payment_methods_user_id_idx;
DROP INDEX IF EXISTS marketplace.vouchers_valid_from_expires_at_idx;
DROP INDEX IF EXISTS marketplace.vouchers_state_idx;
DROP INDEX IF EXISTS marketplace.vouchers_state_expires_at_idx;
DROP INDEX IF EXISTS marketplace.vouchers_provider_id_idx;
DROP INDEX IF EXISTS marketplace.vouchers_location_idx;
DROP INDEX IF EXISTS marketplace.vouchers_discount_type_idx;
DROP INDEX IF EXISTS marketplace.vouchers_category_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_scans_voucher_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_scans_user_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_scans_scanned_at_idx;
DROP INDEX IF EXISTS marketplace.voucher_scans_scan_type_idx;
DROP INDEX IF EXISTS marketplace.voucher_scans_location_idx;
DROP INDEX IF EXISTS marketplace.voucher_redemptions_voucher_id_user_id_key;
DROP INDEX IF EXISTS marketplace.voucher_redemptions_voucher_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_redemptions_user_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_redemptions_redeemed_at_idx;
DROP INDEX IF EXISTS marketplace.voucher_codes_voucher_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_codes_type_is_active_idx;
DROP INDEX IF EXISTS marketplace.voucher_codes_code_key;
DROP INDEX IF EXISTS marketplace.voucher_codes_code_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_year_month_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_status_year_month_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_status_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_published_at_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_provider_id_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_pdf_generated_at_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_edition_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_deleted_at_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_created_by_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_created_at_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_book_type_status_idx;
DROP INDEX IF EXISTS marketplace.voucher_books_book_type_idx;
DROP INDEX IF EXISTS marketplace.voucher_book_pages_book_id_page_number_key;
DROP INDEX IF EXISTS marketplace.voucher_book_pages_book_id_idx;
DROP INDEX IF EXISTS marketplace.reviews_rating_idx;
DROP INDEX IF EXISTS marketplace.reviews_provider_id_idx;
DROP INDEX IF EXISTS marketplace.reviews_customer_id_idx;
DROP INDEX IF EXISTS marketplace.providers_verified_active_idx;
DROP INDEX IF EXISTS marketplace.providers_user_id_key;
DROP INDEX IF EXISTS marketplace.providers_category_id_idx;
DROP INDEX IF EXISTS marketplace.fraud_cases_status_idx;
DROP INDEX IF EXISTS marketplace.fraud_cases_risk_score_idx;
DROP INDEX IF EXISTS marketplace.fraud_cases_redemption_id_key;
DROP INDEX IF EXISTS marketplace.fraud_cases_provider_id_idx;
DROP INDEX IF EXISTS marketplace.fraud_cases_detected_at_idx;
DROP INDEX IF EXISTS marketplace.fraud_cases_customer_id_idx;
DROP INDEX IF EXISTS marketplace.fraud_cases_case_number_key;
DROP INDEX IF EXISTS marketplace.fraud_case_history_fraud_case_id_idx;
DROP INDEX IF EXISTS marketplace.fraud_case_history_created_at_idx;
DROP INDEX IF EXISTS marketplace.customer_vouchers_voucher_id_idx;
DROP INDEX IF EXISTS marketplace.customer_vouchers_status_idx;
DROP INDEX IF EXISTS marketplace.customer_vouchers_customer_id_voucher_id_key;
DROP INDEX IF EXISTS marketplace.customer_vouchers_customer_id_idx;
DROP INDEX IF EXISTS marketplace.customer_vouchers_claimed_at_idx;
DROP INDEX IF EXISTS marketplace.categories_slug_key;
DROP INDEX IF EXISTS marketplace.categories_slug_idx;
DROP INDEX IF EXISTS marketplace.categories_path_idx;
DROP INDEX IF EXISTS marketplace.categories_parent_id_slug_idx;
DROP INDEX IF EXISTS marketplace.categories_parent_id_idx;
DROP INDEX IF EXISTS marketplace.categories_parent_id_active_idx;
DROP INDEX IF EXISTS marketplace.categories_level_idx;
DROP INDEX IF EXISTS marketplace.categories_active_sort_order_idx;
DROP INDEX IF EXISTS marketplace.campaigns_status_start_date_end_date_idx;
DROP INDEX IF EXISTS marketplace.campaigns_status_idx;
DROP INDEX IF EXISTS marketplace.campaigns_status_active_idx;
DROP INDEX IF EXISTS marketplace.campaigns_start_date_end_date_idx;
DROP INDEX IF EXISTS marketplace.campaigns_provider_id_status_idx;
DROP INDEX IF EXISTS marketplace.campaigns_provider_id_status_active_start_date_idx;
DROP INDEX IF EXISTS marketplace.campaigns_provider_id_idx;
DROP INDEX IF EXISTS marketplace.campaigns_provider_id_active_idx;
DROP INDEX IF EXISTS marketplace.campaigns_end_date_status_idx;
DROP INDEX IF EXISTS marketplace.campaigns_budget_idx;
DROP INDEX IF EXISTS marketplace.campaigns_active_idx;
DROP INDEX IF EXISTS marketplace.book_distributions_distributed_at_idx;
DROP INDEX IF EXISTS marketplace.book_distributions_book_id_idx;
DROP INDEX IF EXISTS marketplace.availability_provider_id_day_of_week_start_time_end_time_key;
DROP INDEX IF EXISTS marketplace.availability_provider_id_day_of_week_idx;
DROP INDEX IF EXISTS marketplace.ad_placements_voucher_id_idx;
DROP INDEX IF EXISTS marketplace.ad_placements_provider_id_idx;
DROP INDEX IF EXISTS marketplace.ad_placements_page_id_position_key;
DROP INDEX IF EXISTS marketplace.ad_placements_page_id_idx;
DROP INDEX IF EXISTS marketplace.ad_placements_content_type_idx;
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
ALTER TABLE IF EXISTS ONLY users.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY users.addresses DROP CONSTRAINT IF EXISTS addresses_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY payments.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY payments.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.vouchers DROP CONSTRAINT IF EXISTS vouchers_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_redemptions DROP CONSTRAINT IF EXISTS voucher_redemptions_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_codes DROP CONSTRAINT IF EXISTS voucher_codes_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_books DROP CONSTRAINT IF EXISTS voucher_books_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.voucher_book_pages DROP CONSTRAINT IF EXISTS voucher_book_pages_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.providers DROP CONSTRAINT IF EXISTS providers_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.fraud_case_history DROP CONSTRAINT IF EXISTS fraud_case_history_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.customer_vouchers DROP CONSTRAINT IF EXISTS customer_vouchers_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.campaigns DROP CONSTRAINT IF EXISTS campaigns_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.book_distributions DROP CONSTRAINT IF EXISTS book_distributions_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.availability DROP CONSTRAINT IF EXISTS availability_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_identities DROP CONSTRAINT IF EXISTS user_identities_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_devices DROP CONSTRAINT IF EXISTS user_devices_pkey;
ALTER TABLE IF EXISTS ONLY auth.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_pkey;
ALTER TABLE IF EXISTS ONLY auth.security_events DROP CONSTRAINT IF EXISTS security_events_pkey;
ALTER TABLE IF EXISTS ONLY audit.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
DROP TABLE IF EXISTS users.users;
DROP TABLE IF EXISTS users.customers;
DROP TABLE IF EXISTS users.addresses;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS payments.payments;
DROP TABLE IF EXISTS payments.payment_methods;
DROP TABLE IF EXISTS marketplace.vouchers;
DROP TABLE IF EXISTS marketplace.voucher_scans;
DROP TABLE IF EXISTS marketplace.voucher_redemptions;
DROP TABLE IF EXISTS marketplace.voucher_codes;
DROP TABLE IF EXISTS marketplace.voucher_books;
DROP TABLE IF EXISTS marketplace.voucher_book_pages;
DROP TABLE IF EXISTS marketplace.reviews;
DROP TABLE IF EXISTS marketplace.providers;
DROP TABLE IF EXISTS marketplace.fraud_cases;
DROP TABLE IF EXISTS marketplace.fraud_case_history;
DROP TABLE IF EXISTS marketplace.customer_vouchers;
DROP TABLE IF EXISTS marketplace.categories;
DROP TABLE IF EXISTS marketplace.campaigns;
DROP TABLE IF EXISTS marketplace.book_distributions;
DROP TABLE IF EXISTS marketplace.availability;
DROP TABLE IF EXISTS marketplace.ad_placements;
DROP TABLE IF EXISTS auth.user_mfa_settings;
DROP TABLE IF EXISTS auth.user_identities;
DROP TABLE IF EXISTS auth.user_devices;
DROP TABLE IF EXISTS auth.user_auth_methods;
DROP TABLE IF EXISTS auth.security_events;
DROP TABLE IF EXISTS audit.audit_logs;
DROP TYPE IF EXISTS payments."PaymentType";
DROP TYPE IF EXISTS payments."PaymentStatus";
DROP TYPE IF EXISTS marketplace."VoucherState";
DROP TYPE IF EXISTS marketplace."VoucherScanType";
DROP TYPE IF EXISTS marketplace."VoucherScanSource";
DROP TYPE IF EXISTS marketplace."VoucherDiscountType";
DROP TYPE IF EXISTS marketplace."VoucherCodeType";
DROP TYPE IF EXISTS marketplace."VoucherBookType";
DROP TYPE IF EXISTS marketplace."VoucherBookStatus";
DROP TYPE IF EXISTS marketplace."PageLayoutType";
DROP TYPE IF EXISTS marketplace."FraudCaseStatus";
DROP TYPE IF EXISTS marketplace."CustomerVoucherStatus";
DROP TYPE IF EXISTS marketplace."ContentType";
DROP TYPE IF EXISTS marketplace."CampaignStatus";
DROP TYPE IF EXISTS marketplace."AdSize";
DROP TYPE IF EXISTS auth."UserStatus";
DROP TYPE IF EXISTS auth."UserRole";
DROP TYPE IF EXISTS auth."MfaMethod";
DROP TYPE IF EXISTS auth."DeviceType";
DROP TYPE IF EXISTS audit."AuditAction";
-- DROP EXTENSION IF EXISTS postgis_topology;
-- DROP EXTENSION IF EXISTS postgis_tiger_geocoder;
-- DROP EXTENSION IF EXISTS postgis;
DROP EXTENSION IF EXISTS pgcrypto;
-- DROP EXTENSION IF EXISTS fuzzystrmatch;
DROP SCHEMA IF EXISTS users;
-- DROP SCHEMA IF EXISTS topology;
-- DROP SCHEMA IF EXISTS tiger_data;
-- DROP SCHEMA IF EXISTS tiger;
-- *not* dropping schema, since initdb creates it
DROP SCHEMA IF EXISTS payments;
DROP SCHEMA IF EXISTS marketplace;
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
-- Name: marketplace; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA marketplace;


--
-- Name: payments; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA payments;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

-- COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: users; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA users;


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: AuditAction; Type: TYPE; Schema: audit; Owner: -
--

CREATE TYPE audit."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'PAYMENT',
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
    'CUSTOMER',
    'PROVIDER'
);


--
-- Name: UserStatus; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth."UserStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'BANNED'
);


--
-- Name: AdSize; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."AdSize" AS ENUM (
    'SINGLE',
    'QUARTER',
    'HALF',
    'FULL'
);


--
-- Name: CampaignStatus; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."CampaignStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: ContentType; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."ContentType" AS ENUM (
    'VOUCHER',
    'IMAGE',
    'AD',
    'SPONSORED'
);


--
-- Name: CustomerVoucherStatus; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."CustomerVoucherStatus" AS ENUM (
    'CLAIMED',
    'REDEEMED',
    'EXPIRED'
);


--
-- Name: FraudCaseStatus; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."FraudCaseStatus" AS ENUM (
    'PENDING',
    'REVIEWING',
    'APPROVED',
    'REJECTED',
    'FALSE_POSITIVE'
);


--
-- Name: PageLayoutType; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."PageLayoutType" AS ENUM (
    'STANDARD',
    'MIXED',
    'FULL_PAGE',
    'CUSTOM'
);


--
-- Name: VoucherBookStatus; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherBookStatus" AS ENUM (
    'DRAFT',
    'READY_FOR_PRINT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: VoucherBookType; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherBookType" AS ENUM (
    'MONTHLY',
    'SPECIAL_EDITION',
    'REGIONAL',
    'SEASONAL',
    'PROMOTIONAL'
);


--
-- Name: VoucherCodeType; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherCodeType" AS ENUM (
    'QR',
    'SHORT',
    'STATIC'
);


--
-- Name: VoucherDiscountType; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherDiscountType" AS ENUM (
    'PERCENTAGE',
    'FIXED'
);


--
-- Name: VoucherScanSource; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherScanSource" AS ENUM (
    'CAMERA',
    'GALLERY',
    'LINK',
    'SHARE'
);


--
-- Name: VoucherScanType; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherScanType" AS ENUM (
    'CUSTOMER',
    'BUSINESS'
);


--
-- Name: VoucherState; Type: TYPE; Schema: marketplace; Owner: -
--

CREATE TYPE marketplace."VoucherState" AS ENUM (
    'NEW',
    'PUBLISHED',
    'CLAIMED',
    'REDEEMED',
    'EXPIRED'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: payments; Owner: -
--

CREATE TYPE payments."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


--
-- Name: PaymentType; Type: TYPE; Schema: payments; Owner: -
--

CREATE TYPE payments."PaymentType" AS ENUM (
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'CASH'
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
-- Name: ad_placements; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.ad_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL,
    voucher_id uuid,
    provider_id uuid,
    "position" integer NOT NULL,
    size marketplace."AdSize" DEFAULT 'SINGLE'::marketplace."AdSize" NOT NULL,
    image_url character varying(500),
    qr_code_payload text,
    short_code character varying(20),
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    content_type marketplace."ContentType" DEFAULT 'VOUCHER'::marketplace."ContentType" NOT NULL,
    description text,
    spaces_used integer DEFAULT 1 NOT NULL,
    title character varying(255)
);


--
-- Name: availability; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: book_distributions; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.book_distributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id uuid NOT NULL,
    distributor_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    distributed_at timestamp(6) with time zone NOT NULL,
    location jsonb,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: campaigns; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    name jsonb NOT NULL,
    description jsonb NOT NULL,
    budget numeric(12,2) NOT NULL,
    start_date timestamp(6) with time zone NOT NULL,
    end_date timestamp(6) with time zone NOT NULL,
    status marketplace."CampaignStatus" DEFAULT 'DRAFT'::marketplace."CampaignStatus" NOT NULL,
    target_audience jsonb,
    objectives jsonb,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: categories; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name jsonb NOT NULL,
    description jsonb NOT NULL,
    icon_url character varying(255),
    slug character varying(100) NOT NULL,
    parent_id uuid,
    level integer DEFAULT 1 NOT NULL,
    path text DEFAULT ''::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: customer_vouchers; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.customer_vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    voucher_id uuid NOT NULL,
    claimed_at timestamp(6) with time zone NOT NULL,
    status marketplace."CustomerVoucherStatus" DEFAULT 'CLAIMED'::marketplace."CustomerVoucherStatus" NOT NULL,
    notification_preferences jsonb,
    redeemed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fraud_case_history; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.fraud_case_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fraud_case_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    previous_status marketplace."FraudCaseStatus",
    new_status marketplace."FraudCaseStatus",
    performed_by uuid NOT NULL,
    notes text,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fraud_cases; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.fraud_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_number character varying(20) NOT NULL,
    redemption_id uuid NOT NULL,
    detected_at timestamp(6) with time zone NOT NULL,
    risk_score integer NOT NULL,
    flags jsonb NOT NULL,
    detection_metadata jsonb,
    customer_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    voucher_id uuid NOT NULL,
    status marketplace."FraudCaseStatus" DEFAULT 'PENDING'::marketplace."FraudCaseStatus" NOT NULL,
    reviewed_at timestamp(6) with time zone,
    reviewed_by uuid,
    review_notes text,
    actions_taken jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: providers; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name jsonb NOT NULL,
    business_description jsonb NOT NULL,
    category_id uuid NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    avg_rating numeric(3,2) DEFAULT 0,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: reviews; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    rating integer NOT NULL,
    review text,
    response text,
    response_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: voucher_book_pages; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.voucher_book_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id uuid NOT NULL,
    page_number integer NOT NULL,
    layout_type marketplace."PageLayoutType" DEFAULT 'STANDARD'::marketplace."PageLayoutType" NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: voucher_books; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.voucher_books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    edition character varying(100),
    book_type marketplace."VoucherBookType" DEFAULT 'MONTHLY'::marketplace."VoucherBookType" NOT NULL,
    month integer,
    year integer NOT NULL,
    status marketplace."VoucherBookStatus" DEFAULT 'DRAFT'::marketplace."VoucherBookStatus" NOT NULL,
    total_pages integer DEFAULT 24 NOT NULL,
    published_at timestamp(6) with time zone,
    pdf_url character varying(500),
    pdf_generated_at timestamp(6) with time zone,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone,
    back_image_url character varying(500),
    cover_image_url character varying(500),
    created_by uuid NOT NULL,
    provider_id uuid
);


--
-- Name: voucher_codes; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.voucher_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    code character varying(500) NOT NULL,
    type marketplace."VoucherCodeType" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: voucher_redemptions; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.voucher_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    user_id uuid NOT NULL,
    code_used character varying(500) NOT NULL,
    redeemed_at timestamp(6) with time zone NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: voucher_scans; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.voucher_scans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    user_id uuid,
    scan_type marketplace."VoucherScanType" NOT NULL,
    scan_source marketplace."VoucherScanSource" NOT NULL,
    location public.geography(Point,4326),
    device_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    scanned_at timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: vouchers; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    category_id uuid NOT NULL,
    state marketplace."VoucherState" DEFAULT 'NEW'::marketplace."VoucherState" NOT NULL,
    title jsonb NOT NULL,
    description jsonb NOT NULL,
    terms jsonb NOT NULL,
    discount_type marketplace."VoucherDiscountType" NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'PYG'::character varying NOT NULL,
    location public.geography(Point,4326),
    image_url character varying(500),
    valid_from timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    max_redemptions integer,
    max_redemptions_per_user integer DEFAULT 1 NOT NULL,
    current_redemptions integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone,
    claim_count integer DEFAULT 0 NOT NULL,
    scan_count integer DEFAULT 0 NOT NULL
);


--
-- Name: payment_methods; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    "paymentType" payments."PaymentType" NOT NULL,
    card_brand character varying(50),
    last_four character varying(4),
    expiry_month smallint,
    expiry_year smallint,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: payments; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_method_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'PYG'::character varying NOT NULL,
    status payments."PaymentStatus" DEFAULT 'PENDING'::payments."PaymentStatus" NOT NULL,
    external_reference character varying(255),
    processor_response jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp(6) with time zone
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
    country character varying(100) DEFAULT 'Paraguay'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    location public.geography(Point,4326),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: customers; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    preferences jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
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
    avatar_url character varying(255),
    role auth."UserRole" DEFAULT 'CUSTOMER'::auth."UserRole" NOT NULL,
    status auth."UserStatus" DEFAULT 'ACTIVE'::auth."UserStatus" NOT NULL,
    last_login_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
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
-- Name: ad_placements ad_placements_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.ad_placements
    ADD CONSTRAINT ad_placements_pkey PRIMARY KEY (id);


--
-- Name: availability availability_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.availability
    ADD CONSTRAINT availability_pkey PRIMARY KEY (id);


--
-- Name: book_distributions book_distributions_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.book_distributions
    ADD CONSTRAINT book_distributions_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customer_vouchers customer_vouchers_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.customer_vouchers
    ADD CONSTRAINT customer_vouchers_pkey PRIMARY KEY (id);


--
-- Name: fraud_case_history fraud_case_history_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_case_history
    ADD CONSTRAINT fraud_case_history_pkey PRIMARY KEY (id);


--
-- Name: fraud_cases fraud_cases_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_cases
    ADD CONSTRAINT fraud_cases_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: voucher_book_pages voucher_book_pages_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_book_pages
    ADD CONSTRAINT voucher_book_pages_pkey PRIMARY KEY (id);


--
-- Name: voucher_books voucher_books_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_books
    ADD CONSTRAINT voucher_books_pkey PRIMARY KEY (id);


--
-- Name: voucher_codes voucher_codes_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_codes
    ADD CONSTRAINT voucher_codes_pkey PRIMARY KEY (id);


--
-- Name: voucher_redemptions voucher_redemptions_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_pkey PRIMARY KEY (id);


--
-- Name: voucher_scans voucher_scans_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_scans
    ADD CONSTRAINT voucher_scans_pkey PRIMARY KEY (id);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


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
-- Name: ad_placements_content_type_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX ad_placements_content_type_idx ON marketplace.ad_placements USING btree (content_type);


--
-- Name: ad_placements_page_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX ad_placements_page_id_idx ON marketplace.ad_placements USING btree (page_id);


--
-- Name: ad_placements_page_id_position_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX ad_placements_page_id_position_key ON marketplace.ad_placements USING btree (page_id, "position");


--
-- Name: ad_placements_provider_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX ad_placements_provider_id_idx ON marketplace.ad_placements USING btree (provider_id);


--
-- Name: ad_placements_voucher_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX ad_placements_voucher_id_idx ON marketplace.ad_placements USING btree (voucher_id);


--
-- Name: availability_provider_id_day_of_week_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX availability_provider_id_day_of_week_idx ON marketplace.availability USING btree (provider_id, day_of_week);


--
-- Name: availability_provider_id_day_of_week_start_time_end_time_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX availability_provider_id_day_of_week_start_time_end_time_key ON marketplace.availability USING btree (provider_id, day_of_week, start_time, end_time);


--
-- Name: book_distributions_book_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX book_distributions_book_id_idx ON marketplace.book_distributions USING btree (book_id);


--
-- Name: book_distributions_distributed_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX book_distributions_distributed_at_idx ON marketplace.book_distributions USING btree (distributed_at);


--
-- Name: campaigns_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_active_idx ON marketplace.campaigns USING btree (active);


--
-- Name: campaigns_budget_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_budget_idx ON marketplace.campaigns USING btree (budget);


--
-- Name: campaigns_end_date_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_end_date_status_idx ON marketplace.campaigns USING btree (end_date, status);


--
-- Name: campaigns_provider_id_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_provider_id_active_idx ON marketplace.campaigns USING btree (provider_id, active);


--
-- Name: campaigns_provider_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_provider_id_idx ON marketplace.campaigns USING btree (provider_id);


--
-- Name: campaigns_provider_id_status_active_start_date_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_provider_id_status_active_start_date_idx ON marketplace.campaigns USING btree (provider_id, status, active, start_date);


--
-- Name: campaigns_provider_id_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_provider_id_status_idx ON marketplace.campaigns USING btree (provider_id, status);


--
-- Name: campaigns_start_date_end_date_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_start_date_end_date_idx ON marketplace.campaigns USING btree (start_date, end_date);


--
-- Name: campaigns_status_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_status_active_idx ON marketplace.campaigns USING btree (status, active);


--
-- Name: campaigns_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_status_idx ON marketplace.campaigns USING btree (status);


--
-- Name: campaigns_status_start_date_end_date_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX campaigns_status_start_date_end_date_idx ON marketplace.campaigns USING btree (status, start_date, end_date);


--
-- Name: categories_active_sort_order_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_active_sort_order_idx ON marketplace.categories USING btree (active, sort_order);


--
-- Name: categories_level_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_level_idx ON marketplace.categories USING btree (level);


--
-- Name: categories_parent_id_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_parent_id_active_idx ON marketplace.categories USING btree (parent_id, active);


--
-- Name: categories_parent_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_parent_id_idx ON marketplace.categories USING btree (parent_id);


--
-- Name: categories_parent_id_slug_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_parent_id_slug_idx ON marketplace.categories USING btree (parent_id, slug);


--
-- Name: categories_path_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_path_idx ON marketplace.categories USING btree (path);


--
-- Name: categories_slug_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX categories_slug_idx ON marketplace.categories USING btree (slug);


--
-- Name: categories_slug_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON marketplace.categories USING btree (slug);


--
-- Name: customer_vouchers_claimed_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX customer_vouchers_claimed_at_idx ON marketplace.customer_vouchers USING btree (claimed_at);


--
-- Name: customer_vouchers_customer_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX customer_vouchers_customer_id_idx ON marketplace.customer_vouchers USING btree (customer_id);


--
-- Name: customer_vouchers_customer_id_voucher_id_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX customer_vouchers_customer_id_voucher_id_key ON marketplace.customer_vouchers USING btree (customer_id, voucher_id);


--
-- Name: customer_vouchers_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX customer_vouchers_status_idx ON marketplace.customer_vouchers USING btree (status);


--
-- Name: customer_vouchers_voucher_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX customer_vouchers_voucher_id_idx ON marketplace.customer_vouchers USING btree (voucher_id);


--
-- Name: fraud_case_history_created_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_case_history_created_at_idx ON marketplace.fraud_case_history USING btree (created_at);


--
-- Name: fraud_case_history_fraud_case_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_case_history_fraud_case_id_idx ON marketplace.fraud_case_history USING btree (fraud_case_id);


--
-- Name: fraud_cases_case_number_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX fraud_cases_case_number_key ON marketplace.fraud_cases USING btree (case_number);


--
-- Name: fraud_cases_customer_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_cases_customer_id_idx ON marketplace.fraud_cases USING btree (customer_id);


--
-- Name: fraud_cases_detected_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_cases_detected_at_idx ON marketplace.fraud_cases USING btree (detected_at);


--
-- Name: fraud_cases_provider_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_cases_provider_id_idx ON marketplace.fraud_cases USING btree (provider_id);


--
-- Name: fraud_cases_redemption_id_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX fraud_cases_redemption_id_key ON marketplace.fraud_cases USING btree (redemption_id);


--
-- Name: fraud_cases_risk_score_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_cases_risk_score_idx ON marketplace.fraud_cases USING btree (risk_score);


--
-- Name: fraud_cases_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX fraud_cases_status_idx ON marketplace.fraud_cases USING btree (status);


--
-- Name: providers_category_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX providers_category_id_idx ON marketplace.providers USING btree (category_id);


--
-- Name: providers_user_id_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX providers_user_id_key ON marketplace.providers USING btree (user_id);


--
-- Name: providers_verified_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX providers_verified_active_idx ON marketplace.providers USING btree (verified, active);


--
-- Name: reviews_customer_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX reviews_customer_id_idx ON marketplace.reviews USING btree (customer_id);


--
-- Name: reviews_provider_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX reviews_provider_id_idx ON marketplace.reviews USING btree (provider_id);


--
-- Name: reviews_rating_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX reviews_rating_idx ON marketplace.reviews USING btree (rating);


--
-- Name: voucher_book_pages_book_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_book_pages_book_id_idx ON marketplace.voucher_book_pages USING btree (book_id);


--
-- Name: voucher_book_pages_book_id_page_number_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX voucher_book_pages_book_id_page_number_key ON marketplace.voucher_book_pages USING btree (book_id, page_number);


--
-- Name: voucher_books_book_type_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_book_type_idx ON marketplace.voucher_books USING btree (book_type);


--
-- Name: voucher_books_book_type_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_book_type_status_idx ON marketplace.voucher_books USING btree (book_type, status);


--
-- Name: voucher_books_created_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_created_at_idx ON marketplace.voucher_books USING btree (created_at);


--
-- Name: voucher_books_created_by_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_created_by_idx ON marketplace.voucher_books USING btree (created_by);


--
-- Name: voucher_books_deleted_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_deleted_at_idx ON marketplace.voucher_books USING btree (deleted_at);


--
-- Name: voucher_books_edition_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_edition_idx ON marketplace.voucher_books USING btree (edition);


--
-- Name: voucher_books_pdf_generated_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_pdf_generated_at_idx ON marketplace.voucher_books USING btree (pdf_generated_at);


--
-- Name: voucher_books_provider_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_provider_id_idx ON marketplace.voucher_books USING btree (provider_id);


--
-- Name: voucher_books_published_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_published_at_idx ON marketplace.voucher_books USING btree (published_at);


--
-- Name: voucher_books_status_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_status_idx ON marketplace.voucher_books USING btree (status);


--
-- Name: voucher_books_status_year_month_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_status_year_month_idx ON marketplace.voucher_books USING btree (status, year, month);


--
-- Name: voucher_books_year_month_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_books_year_month_idx ON marketplace.voucher_books USING btree (year, month);


--
-- Name: voucher_codes_code_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_codes_code_idx ON marketplace.voucher_codes USING btree (code);


--
-- Name: voucher_codes_code_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX voucher_codes_code_key ON marketplace.voucher_codes USING btree (code);


--
-- Name: voucher_codes_type_is_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_codes_type_is_active_idx ON marketplace.voucher_codes USING btree (type, is_active);


--
-- Name: voucher_codes_voucher_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_codes_voucher_id_idx ON marketplace.voucher_codes USING btree (voucher_id);


--
-- Name: voucher_redemptions_redeemed_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_redemptions_redeemed_at_idx ON marketplace.voucher_redemptions USING btree (redeemed_at);


--
-- Name: voucher_redemptions_user_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_redemptions_user_id_idx ON marketplace.voucher_redemptions USING btree (user_id);


--
-- Name: voucher_redemptions_voucher_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_redemptions_voucher_id_idx ON marketplace.voucher_redemptions USING btree (voucher_id);


--
-- Name: voucher_redemptions_voucher_id_user_id_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX voucher_redemptions_voucher_id_user_id_key ON marketplace.voucher_redemptions USING btree (voucher_id, user_id);


--
-- Name: voucher_scans_location_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_scans_location_idx ON marketplace.voucher_scans USING gist (location);


--
-- Name: voucher_scans_scan_type_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_scans_scan_type_idx ON marketplace.voucher_scans USING btree (scan_type);


--
-- Name: voucher_scans_scanned_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_scans_scanned_at_idx ON marketplace.voucher_scans USING btree (scanned_at);


--
-- Name: voucher_scans_user_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_scans_user_id_idx ON marketplace.voucher_scans USING btree (user_id);


--
-- Name: voucher_scans_voucher_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX voucher_scans_voucher_id_idx ON marketplace.voucher_scans USING btree (voucher_id);


--
-- Name: vouchers_category_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_category_id_idx ON marketplace.vouchers USING btree (category_id);


--
-- Name: vouchers_discount_type_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_discount_type_idx ON marketplace.vouchers USING btree (discount_type);


--
-- Name: vouchers_location_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_location_idx ON marketplace.vouchers USING gist (location);


--
-- Name: vouchers_provider_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_provider_id_idx ON marketplace.vouchers USING btree (provider_id);


--
-- Name: vouchers_state_expires_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_state_expires_at_idx ON marketplace.vouchers USING btree (state, expires_at);


--
-- Name: vouchers_state_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_state_idx ON marketplace.vouchers USING btree (state);


--
-- Name: vouchers_valid_from_expires_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX vouchers_valid_from_expires_at_idx ON marketplace.vouchers USING btree (valid_from, expires_at);


--
-- Name: payment_methods_user_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX payment_methods_user_id_idx ON payments.payment_methods USING btree (user_id);


--
-- Name: payments_external_reference_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX payments_external_reference_idx ON payments.payments USING btree (external_reference);


--
-- Name: payments_status_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX payments_status_idx ON payments.payments USING btree (status);


--
-- Name: addresses_location_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX addresses_location_idx ON users.addresses USING gist (location);


--
-- Name: addresses_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX addresses_user_id_idx ON users.addresses USING btree (user_id);


--
-- Name: customers_user_id_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX customers_user_id_key ON users.customers USING btree (user_id);


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
-- Name: ad_placements ad_placements_page_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.ad_placements
    ADD CONSTRAINT ad_placements_page_id_fkey FOREIGN KEY (page_id) REFERENCES marketplace.voucher_book_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ad_placements ad_placements_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.ad_placements
    ADD CONSTRAINT ad_placements_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_placements ad_placements_voucher_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.ad_placements
    ADD CONSTRAINT ad_placements_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES marketplace.vouchers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: availability availability_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.availability
    ADD CONSTRAINT availability_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_distributions book_distributions_book_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.book_distributions
    ADD CONSTRAINT book_distributions_book_id_fkey FOREIGN KEY (book_id) REFERENCES marketplace.voucher_books(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaigns campaigns_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.campaigns
    ADD CONSTRAINT campaigns_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES marketplace.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_vouchers customer_vouchers_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.customer_vouchers
    ADD CONSTRAINT customer_vouchers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_vouchers customer_vouchers_voucher_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.customer_vouchers
    ADD CONSTRAINT customer_vouchers_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES marketplace.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fraud_case_history fraud_case_history_fraud_case_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_case_history
    ADD CONSTRAINT fraud_case_history_fraud_case_id_fkey FOREIGN KEY (fraud_case_id) REFERENCES marketplace.fraud_cases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fraud_case_history fraud_case_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_case_history
    ADD CONSTRAINT fraud_case_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_cases
    ADD CONSTRAINT fraud_cases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_cases
    ADD CONSTRAINT fraud_cases_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_redemption_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_cases
    ADD CONSTRAINT fraud_cases_redemption_id_fkey FOREIGN KEY (redemption_id) REFERENCES marketplace.voucher_redemptions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_cases
    ADD CONSTRAINT fraud_cases_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fraud_cases fraud_cases_voucher_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.fraud_cases
    ADD CONSTRAINT fraud_cases_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES marketplace.vouchers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: providers providers_category_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.providers
    ADD CONSTRAINT providers_category_id_fkey FOREIGN KEY (category_id) REFERENCES marketplace.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: providers providers_user_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.providers
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.reviews
    ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.reviews
    ADD CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voucher_book_pages voucher_book_pages_book_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_book_pages
    ADD CONSTRAINT voucher_book_pages_book_id_fkey FOREIGN KEY (book_id) REFERENCES marketplace.voucher_books(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voucher_books voucher_books_created_by_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_books
    ADD CONSTRAINT voucher_books_created_by_fkey FOREIGN KEY (created_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voucher_books voucher_books_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_books
    ADD CONSTRAINT voucher_books_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voucher_codes voucher_codes_voucher_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_codes
    ADD CONSTRAINT voucher_codes_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES marketplace.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voucher_redemptions voucher_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voucher_redemptions voucher_redemptions_voucher_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES marketplace.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voucher_scans voucher_scans_user_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_scans
    ADD CONSTRAINT voucher_scans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voucher_scans voucher_scans_voucher_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.voucher_scans
    ADD CONSTRAINT voucher_scans_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES marketplace.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vouchers vouchers_category_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.vouchers
    ADD CONSTRAINT vouchers_category_id_fkey FOREIGN KEY (category_id) REFERENCES marketplace.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vouchers vouchers_provider_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.vouchers
    ADD CONSTRAINT vouchers_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES marketplace.providers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.payment_methods
    ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.payments
    ADD CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payments.payment_methods(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

