-- Add admin users for production deployment
-- This migration is idempotent - safe to run multiple times

-- Create Damian admin user if not exists
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
  '$2b$10$Wpy2FDu67D8l6j0I1dXNJOlJQGp5w4UaWnYWju/n4HTYAwmrk.LiK', -- Pika@Admin2024!Secure
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

-- Create Roman admin user if not exists
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
  '$2b$10$Wpy2FDu67D8l6j0I1dXNJOlJQGp5w4UaWnYWju/n4HTYAwmrk.LiK', -- Pika@Admin2024!Secure
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