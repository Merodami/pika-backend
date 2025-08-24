#!/usr/bin/env tsx

import { UserRole, UserStatus } from '@pika/types'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load production environment variables
dotenv.config({ path: '.env.production' })

// Get email from command line argument
const args = process.argv.slice(2)
const emailArg = args[0]

if (!emailArg) {
  console.error('❌ Please provide an email address as an argument')
  console.error('Usage: tsx scripts/generate-admin-sql.ts <email>')
  console.error('Example: tsx scripts/generate-admin-sql.ts admin@example.com')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(emailArg)) {
  console.error('❌ Invalid email format:', emailArg)
  process.exit(1)
}

// Generate a secure password
function generateSecurePassword(): string {
  const length = 16
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''

  // Ensure at least one of each required character type
  password += 'A' // Uppercase
  password += 'a' // Lowercase
  password += '0' // Number
  password += '!' // Special character

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(crypto.randomInt(charset.length))
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('')
}

// Extract name from email
function extractNameFromEmail(email: string): {
  firstName: string
  lastName: string
} {
  const [localPart] = email.split('@')
  const parts = localPart.split(/[._-]/)

  if (parts.length >= 2) {
    return {
      firstName:
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      lastName:
        parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(),
    }
  }

  return {
    firstName:
      parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
    lastName: 'Admin',
  }
}

async function generateAdminSQL() {
  console.log('🔐 Generating Admin User SQL for Production...\n')

  const adminEmail = emailArg.toLowerCase()
  const { firstName, lastName } = extractNameFromEmail(adminEmail)
  const adminPassword = generateSecurePassword()
  const hashedPassword = await bcrypt.hash(adminPassword, 12)
  const userId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  // Generate a unique phone number for testing (optional)
  const phoneNumber = `+1555${Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0')}`

  // SQL queries for creating admin user
  const sql = `
-- ============================================
-- Production Admin User Creation SQL
-- Generated: ${timestamp}
-- Email: ${adminEmail}
-- ============================================

-- IMPORTANT: Run this query on your production database
-- Keep the credentials secure and delete this file after use

BEGIN;

-- Create the admin user record
-- Password is stored directly in the users table (bcrypt hashed)
INSERT INTO users.users (
  id,
  email,
  email_verified,
  password,
  first_name,
  last_name,
  phone_number,
  phone_verified,
  avatar_url,
  role,
  status,
  last_login_at,
  created_at,
  updated_at,
  deleted_at,
  date_of_birth,
  stripe_user_id,
  preferred_language,
  primary_business_id,
  settings
) VALUES (
  '${userId}'::uuid,
  '${adminEmail}',
  true,  -- email_verified (admin users are pre-verified)
  '${hashedPassword}',  -- bcrypt hashed password
  '${firstName}',
  '${lastName}',
  '${phoneNumber}',
  false,  -- phone_verified (not verified by default)
  NULL,  -- avatar_url
  '${UserRole.ADMIN}',  -- role: admin
  '${UserStatus.ACTIVE}',  -- status: active
  NOW(),  -- last_login_at
  NOW(),  -- created_at
  NOW(),  -- updated_at
  NULL,  -- deleted_at
  NULL,  -- date_of_birth
  NULL,  -- stripe_user_id
  'en',  -- preferred_language
  NULL,  -- primary_business_id
  '{}'::jsonb  -- settings (empty JSON object)
);

-- Optional: Create user settings with default preferences
INSERT INTO users.user_settings (
  id,
  user_id,
  language,
  theme,
  notifications_enabled,
  email_notifications,
  push_notifications,
  sms_notifications,
  marketing_emails,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${userId}'::uuid,
  'en',
  'light',
  true,
  true,
  false,  -- push_notifications off
  false,  -- sms_notifications off
  false,  -- marketing_emails off
  NOW(),
  NOW()
);

-- Optional: Set user language preference
INSERT INTO i18n.user_language_preferences (
  id,
  user_id,
  language_code,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${userId}'::uuid,
  'en',
  NOW(),
  NOW()
);

COMMIT;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the admin user was created:

SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  email_verified,
  password IS NOT NULL as has_password,
  created_at
FROM users.users
WHERE email = '${adminEmail}';
`.trim()

  // Create filename based on email (sanitized)
  const sanitizedEmail = adminEmail.replace(/[@.]/g, '_')

  // Write SQL to file
  const outputPath = path.join(
    process.cwd(),
    `admin-user-${sanitizedEmail}.sql`,
  )
  fs.writeFileSync(outputPath, sql, 'utf8')

  // Write credentials to separate secure file
  const credentialsPath = path.join(
    process.cwd(),
    `admin-credentials-${sanitizedEmail}.txt`,
  )
  const credentials = `
========================================
ADMIN CREDENTIALS - KEEP SECURE
========================================
Generated: ${timestamp}
Environment: Production

Email: ${adminEmail}
Password: ${adminPassword}

API Endpoint: ${process.env.API_GATEWAY_BASE_URL || 'https://api.the-voucher-book.vercel.app'}
App Name: ${process.env.APP_NAME || 'The VoucherBook'}

========================================
IMPORTANT SECURITY NOTES:
========================================
1. Change this password after first login
2. Delete this file after saving credentials
3. Never commit this file to version control
4. Store credentials in a secure password manager
5. Enable 2FA as soon as possible

User ID: ${userId}
========================================
`.trim()

  fs.writeFileSync(credentialsPath, credentials, 'utf8')

  console.log('✅ Files generated successfully!\n')
  console.log(`📁 SQL File: admin-user-${sanitizedEmail}.sql`)
  console.log(`🔑 Credentials: admin-credentials-${sanitizedEmail}.txt`)
  console.log('\n⚠️  SECURITY REMINDERS:')
  console.log('   1. Run the SQL queries on your production database')
  console.log('   2. Save the credentials securely')
  console.log('   3. DELETE both files after use')
  console.log('   4. Change the password after first login')
  console.log('   5. Enable 2FA for additional security')
  console.log('\n📧 Admin Email:', adminEmail)
  console.log(`👤 Name: ${firstName} ${lastName}`)
  console.log(`📱 Phone: ${phoneNumber}`)
  console.log('🔐 Password has been generated (see credentials file)')

  // Add to .gitignore if not already there
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')

  if (!gitignoreContent.includes('admin-user-*.sql')) {
    fs.appendFileSync(
      gitignorePath,
      '\n# Admin user creation files (NEVER COMMIT)\nadmin-user-*.sql\nadmin-credentials-*.txt\n',
    )
    console.log('\n✅ Added admin files pattern to .gitignore')
  }
}

// Run the script
generateAdminSQL().catch(console.error)
