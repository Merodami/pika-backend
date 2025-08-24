# Before Going Live - Production Checklist

## Quick Guide - Admin Access

### Admin User Setup

Admin users are created manually via SQL queries in Vercel Dashboard.
See `VERCEL_SQL_QUERIES.md` for the queries and credentials.

### Local Development

For local development, use:

```bash
yarn flow:setup-users  # Creates test users including admin@example.com
yarn user:create <email> <password> admin  # Create custom admin user
```

---

## ⚠️ CRITICAL: Before Production Deployment

### 1. Security Checklist

- [ ] Update `vercel-postbuild.sh` to remove test user creation for production
- [ ] Ensure `VERCEL_ENV === 'production'` skips all test data
- [ ] Set strong, unique passwords for production admins (use SQL queries)
- [ ] Enable MFA for all admin accounts
- [ ] Rotate all API keys and secrets
- [ ] Review and remove any `.env` files from deployment

### 2. Environment Variables to Review

- `MIGRATION_DATABASE_URL` - Direct connection for migrations
- `DATABASE_URL` - Pooled connection for runtime
- Remove all test/development URLs before production

### 3. Production Admin Setup

For production, admins should be created through:

- Direct SQL queries in database dashboard (see `VERCEL_SQL_QUERIES.md`)
- Environment-based seed script with secure passwords from secrets
- Integration with corporate SSO/identity provider

---

## Notes

- Never commit production passwords to the repository
- Consider using a secrets manager for production credentials
- Admin users are created via SQL, not migrations
