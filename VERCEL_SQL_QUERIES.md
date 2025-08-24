# Vercel Database SQL Queries

## Create Admin Users - Execute in Vercel Dashboard

Copy and paste this SQL query in your Vercel Postgres dashboard:

```sql
-- Create admin users with secure passwords
-- This query is idempotent (safe to run multiple times)

-- Create Damian admin user
INSERT INTO "users"."users" (
  "id",
  "email",
  "password",
  "first_name",
  "last_name",
  "phone_number",
  "date_of_birth",
  "role",
  "status",
  "email_verified",
  "phone_verified",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  'damian@pika.com',
  '$2b$10$WHaM.AH4fqzcg0/5NcGpg./flpX0c4.5.d1aMABVWCJEgFNTfC0Fi',
  'Damian',
  'Admin',
  '+15551234501',
  '1990-01-01'::date,
  'admin'::"identity"."UserRole",
  'active'::"identity"."UserStatus",
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "users"."users" WHERE "email" = 'damian@pika.com'
);

-- Create Roman admin user
INSERT INTO "users"."users" (
  "id",
  "email",
  "password",
  "first_name",
  "last_name",
  "phone_number",
  "date_of_birth",
  "role",
  "status",
  "email_verified",
  "phone_verified",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  'roman@pika.com',
  '$2b$10$Vwrokr9logXMiWBgUgXrXegavMsFpVHLpd3tBqfmM//gcji5Gw4lu',
  'Roman',
  'Admin',
  '+15551234502',
  '1990-01-01'::date,
  'admin'::"identity"."UserRole",
  'active'::"identity"."UserStatus",
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "users"."users" WHERE "email" = 'roman@pika.com'
);
```

## 🔐 Admin Credentials

**IMPORTANT: Save these passwords securely! They are randomly generated and unique.**

| User   | Email             | Password                |
| ------ | ----------------- | ----------------------- |
| Damian | `damian@pika.com` | `ib69A1Va0L0M3jc@Pk24!` |
| Roman  | `roman@pika.com`  | `eJXADFJyrcN7D3m@Pk24!` |

## How to Execute

1. Go to your Vercel Dashboard
2. Navigate to your project
3. Go to the "Storage" tab
4. Select your Postgres database
5. Click on "Query" or "Data" tab
6. Paste the SQL query above
7. Execute the query
8. Save the passwords securely (password manager recommended)

## Verify Users Were Created

Run this query to verify:

```sql
SELECT email, role, status, email_verified
FROM "users"."users"
WHERE email IN ('damian@pika.com', 'roman@pika.com');
```

## Update Passwords (If Needed)

If you need to change passwords later:

```sql
-- First generate a new bcrypt hash for your new password
-- Then update:
UPDATE "users"."users"
SET password = '$2b$10$[your-new-hash-here]'
WHERE email = 'damian@pika.com';
```

## Security Notes

- These passwords are strong and randomly generated
- Each admin has a unique password
- Passwords meet security requirements: 16+ chars, mixed case, numbers, special chars
- Store these passwords in a secure password manager
- Consider enabling MFA after first login
