-- DropForeignKey
ALTER TABLE "catalog"."categories" DROP CONSTRAINT "categories_parent_id_fkey";

-- CreateIndex
CREATE INDEX "voucher_scans_scan_type_scan_source_scanned_at_idx" ON "analytics"."voucher_scans"("scan_type", "scan_source", "scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_validation_code_idx" ON "analytics"."voucher_scans"("validation_code");

-- CreateIndex
CREATE INDEX "voucher_scans_campaign_scanned_at_idx" ON "analytics"."voucher_scans"("campaign", "scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_business_id_scan_type_scanned_at_idx" ON "analytics"."voucher_scans"("business_id", "scan_type", "scanned_at");

-- CreateIndex
CREATE INDEX "businesses_active_verified_category_id_idx" ON "business"."businesses"("active", "verified", "category_id");

-- CreateIndex
CREATE INDEX "businesses_category_id_active_avg_rating_idx" ON "business"."businesses"("category_id", "active", "avg_rating" DESC);

-- CreateIndex
CREATE INDEX "businesses_active_verified_favorite_count_idx" ON "business"."businesses"("active", "verified", "favorite_count" DESC);

-- CreateIndex
CREATE INDEX "businesses_approved_active_created_at_idx" ON "business"."businesses"("approved", "active", "created_at");

-- CreateIndex
CREATE INDEX "businesses_user_id_active_deleted_at_idx" ON "business"."businesses"("user_id", "active", "deleted_at");

-- CreateIndex
CREATE INDEX "businesses_approved_by_approved_at_idx" ON "business"."businesses"("approved_by", "approved_at");

-- CreateIndex
CREATE INDEX "businesses_business_name_key_idx" ON "business"."businesses"("business_name_key");

-- CreateIndex
CREATE INDEX "businesses_created_at_active_idx" ON "business"."businesses"("created_at", "active");

-- CreateIndex
CREATE INDEX "businesses_category_id_verified_active_avg_rating_idx" ON "business"."businesses"("category_id", "verified", "active", "avg_rating");

-- CreateIndex
CREATE INDEX "categories_level_is_active_sort_order_idx" ON "catalog"."categories"("level", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "categories_parent_id_sort_order_is_active_idx" ON "catalog"."categories"("parent_id", "sort_order", "is_active");

-- CreateIndex
CREATE INDEX "categories_path_is_active_idx" ON "catalog"."categories"("path", "is_active");

-- CreateIndex
CREATE INDEX "categories_created_by_idx" ON "catalog"."categories"("created_by");

-- CreateIndex
CREATE INDEX "categories_updated_by_idx" ON "catalog"."categories"("updated_by");

-- CreateIndex
CREATE INDEX "categories_is_active_level_sort_order_idx" ON "catalog"."categories"("is_active", "level", "sort_order");

-- CreateIndex
CREATE INDEX "categories_slug_is_active_idx" ON "catalog"."categories"("slug", "is_active");

-- CreateIndex
CREATE INDEX "favourite_businesses_user_id_created_at_idx" ON "favourites"."favourite_businesses"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "favourite_businesses_business_id_created_at_idx" ON "favourites"."favourite_businesses"("business_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "favourite_vouchers_user_id_created_at_idx" ON "favourites"."favourite_vouchers"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "favourite_vouchers_voucher_id_created_at_idx" ON "favourites"."favourite_vouchers"("voucher_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "security_events_user_id_event_type_created_at_idx" ON "identity"."security_events"("user_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "security_events_event_type_risk_score_idx" ON "identity"."security_events"("event_type", "risk_score");

-- CreateIndex
CREATE INDEX "security_events_ip_address_created_at_idx" ON "identity"."security_events"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "security_events_device_id_created_at_idx" ON "identity"."security_events"("device_id", "created_at");

-- CreateIndex
CREATE INDEX "user_auth_methods_is_verified_auth_method_idx" ON "identity"."user_auth_methods"("is_verified", "auth_method");

-- CreateIndex
CREATE INDEX "user_auth_methods_last_used_at_auth_method_idx" ON "identity"."user_auth_methods"("last_used_at", "auth_method");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_is_enabled_auth_method_idx" ON "identity"."user_auth_methods"("user_id", "is_enabled", "auth_method");

-- CreateIndex
CREATE INDEX "user_devices_device_type_last_active_at_idx" ON "identity"."user_devices"("device_type", "last_active_at");

-- CreateIndex
CREATE INDEX "user_devices_is_trusted_trust_expires_at_idx" ON "identity"."user_devices"("is_trusted", "trust_expires_at");

-- CreateIndex
CREATE INDEX "user_devices_user_id_device_type_is_trusted_idx" ON "identity"."user_devices"("user_id", "device_type", "is_trusted");

-- CreateIndex
CREATE INDEX "user_devices_last_ip_address_idx" ON "identity"."user_devices"("last_ip_address");

-- CreateIndex
CREATE INDEX "user_identities_user_id_provider_idx" ON "identity"."user_identities"("user_id", "provider");

-- CreateIndex
CREATE INDEX "user_identities_is_email_verified_provider_idx" ON "identity"."user_identities"("is_email_verified", "provider");

-- CreateIndex
CREATE INDEX "user_identities_last_login_idx" ON "identity"."user_identities"("last_login");

-- CreateIndex
CREATE INDEX "user_identities_created_at_idx" ON "identity"."user_identities"("created_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "payments"."subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_status_current_period_end_idx" ON "payments"."subscriptions"("status", "current_period_end");

-- CreateIndex
CREATE INDEX "subscriptions_status_cancel_at_period_end_idx" ON "payments"."subscriptions"("status", "cancel_at_period_end");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "payments"."subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_status_idx" ON "payments"."subscriptions"("current_period_end", "status");

-- CreateIndex
CREATE INDEX "subscriptions_trial_end_status_idx" ON "payments"."subscriptions"("trial_end", "status");

-- CreateIndex
CREATE INDEX "subscriptions_created_at_status_idx" ON "payments"."subscriptions"("created_at", "status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_status_idx" ON "payments"."subscriptions"("plan_id", "status");

-- CreateIndex
CREATE INDEX "communication_logs_status_created_at_idx" ON "support"."communication_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "communication_logs_user_id_type_status_idx" ON "support"."communication_logs"("user_id", "type", "status");

-- CreateIndex
CREATE INDEX "communication_logs_status_sent_at_idx" ON "support"."communication_logs"("status", "sent_at");

-- CreateIndex
CREATE INDEX "communication_logs_provider_status_idx" ON "support"."communication_logs"("provider", "status");

-- CreateIndex
CREATE INDEX "communication_logs_failed_at_status_idx" ON "support"."communication_logs"("failed_at", "status");

-- CreateIndex
CREATE INDEX "communication_logs_template_id_status_created_at_idx" ON "support"."communication_logs"("template_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "communication_logs_type_created_at_idx" ON "support"."communication_logs"("type", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "support"."notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_type_user_id_created_at_idx" ON "support"."notifications"("type", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "support"."notifications"("read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "support"."notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_type_is_read_idx" ON "support"."notifications"("user_id", "type", "is_read");

-- CreateIndex
CREATE INDEX "problems_status_priority_created_at_idx" ON "support"."problems"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "problems_assigned_to_status_priority_idx" ON "support"."problems"("assigned_to", "status", "priority");

-- CreateIndex
CREATE INDEX "problems_user_id_status_created_at_idx" ON "support"."problems"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "problems_type_status_priority_idx" ON "support"."problems"("type", "status", "priority");

-- CreateIndex
CREATE INDEX "problems_resolved_at_idx" ON "support"."problems"("resolved_at");

-- CreateIndex
CREATE INDEX "problems_status_assigned_to_priority_idx" ON "support"."problems"("status", "assigned_to", "priority");

-- CreateIndex
CREATE INDEX "problems_created_at_status_idx" ON "support"."problems"("created_at", "status");

-- CreateIndex
CREATE INDEX "users_role_status_deleted_at_idx" ON "users"."users"("role", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "users_status_role_created_at_idx" ON "users"."users"("status", "role", "created_at");

-- CreateIndex
CREATE INDEX "users_role_created_at_idx" ON "users"."users"("role", "created_at");

-- CreateIndex
CREATE INDEX "users_email_verified_status_idx" ON "users"."users"("email_verified", "status");

-- CreateIndex
CREATE INDEX "users_phone_verified_status_idx" ON "users"."users"("phone_verified", "status");

-- CreateIndex
CREATE INDEX "users_stripe_user_id_idx" ON "users"."users"("stripe_user_id");

-- CreateIndex
CREATE INDEX "users_preferred_language_status_idx" ON "users"."users"("preferred_language", "status");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"."users"("last_login_at");

-- CreateIndex
CREATE INDEX "users_created_at_role_idx" ON "users"."users"("created_at", "role");

-- CreateIndex
CREATE INDEX "users_role_primary_business_id_status_idx" ON "users"."users"("role", "primary_business_id", "status");

-- CreateIndex
CREATE INDEX "users_first_name_last_name_idx" ON "users"."users"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "customer_vouchers_customer_id_status_claimed_at_idx" ON "voucher"."customer_vouchers"("customer_id", "status", "claimed_at");

-- CreateIndex
CREATE INDEX "customer_vouchers_status_redeemed_at_idx" ON "voucher"."customer_vouchers"("status", "redeemed_at");

-- CreateIndex
CREATE INDEX "voucher_codes_type_is_active_idx" ON "voucher"."voucher_codes"("type", "is_active");

-- CreateIndex
CREATE INDEX "voucher_codes_created_at_idx" ON "voucher"."voucher_codes"("created_at");

-- CreateIndex
CREATE INDEX "recent_redemptions_idx" ON "voucher"."voucher_redemptions"("redeemed_at" DESC);

-- CreateIndex
CREATE INDEX "voucher_redemptions_created_at_idx" ON "voucher"."voucher_redemptions"("created_at");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_type_expires_at_idx" ON "voucher"."voucher_validation_codes"("type", "expires_at");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_used_at_used_by_idx" ON "voucher"."voucher_validation_codes"("used_at", "used_by");

-- CreateIndex
CREATE INDEX "voucher_validation_codes_voucher_id_type_expires_at_idx" ON "voucher"."voucher_validation_codes"("voucher_id", "type", "expires_at");

-- CreateIndex
CREATE INDEX "vouchers_state_category_id_valid_until_idx" ON "voucher"."vouchers"("state", "category_id", "valid_until");

-- CreateIndex
CREATE INDEX "vouchers_state_type_valid_until_idx" ON "voucher"."vouchers"("state", "type", "valid_until");

-- CreateIndex
CREATE INDEX "vouchers_business_id_state_valid_until_idx" ON "voucher"."vouchers"("business_id", "state", "valid_until");

-- CreateIndex
CREATE INDEX "vouchers_state_valid_from_valid_until_idx" ON "voucher"."vouchers"("state", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "vouchers_scan_count_state_idx" ON "voucher"."vouchers"("scan_count" DESC, "state");

-- CreateIndex
CREATE INDEX "vouchers_claim_count_state_idx" ON "voucher"."vouchers"("claim_count" DESC, "state");

-- CreateIndex
CREATE INDEX "vouchers_redemptions_count_max_redemptions_idx" ON "voucher"."vouchers"("redemptions_count", "max_redemptions");

-- CreateIndex
CREATE INDEX "vouchers_type_discount_idx" ON "voucher"."vouchers"("type", "discount");

-- CreateIndex
CREATE INDEX "vouchers_currency_type_idx" ON "voucher"."vouchers"("currency", "type");

-- CreateIndex
CREATE INDEX "vouchers_state_deleted_at_valid_until_idx" ON "voucher"."vouchers"("state", "deleted_at", "valid_until");

-- AddForeignKey
ALTER TABLE "catalog"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "catalog"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."categories" ADD CONSTRAINT "categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."categories" ADD CONSTRAINT "categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
