#!/usr/bin/env tsx

// Load environment variables BEFORE any other imports
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Parse command line arguments
const args = process.argv.slice(2)
const environment = args[0] || 'local' // Default to 'local' if no argument provided

// Show help if requested
if (
  environment === '--help' ||
  environment === '-h' ||
  environment === 'help'
) {
  console.log('🎫 Generate Long-Lived JWT Tokens for Test Users\n')
  console.log(
    'Usage: yarn tsx scripts/generate-long-lived-token.ts [environment]\n',
  )
  console.log('Environments:')
  console.log('  local       - Use .env.local (default)')
  console.log('  prod        - Use .env.production')
  console.log('  production  - Use .env.production (alias for prod)\n')
  console.log('Examples:')
  console.log('  yarn tsx scripts/generate-long-lived-token.ts')
  console.log('  yarn tsx scripts/generate-long-lived-token.ts local')
  console.log('  yarn tsx scripts/generate-long-lived-token.ts prod')
  process.exit(0)
}

// Load environment variables based on the argument
let envPath: string
if (environment === 'prod' || environment === 'production') {
  envPath = '.env.production'
  console.log('🔧 Using production environment (.env.production)')
} else if (environment === 'local') {
  envPath = '.env.local'
  console.log('🔧 Using local environment (.env.local)')
} else {
  console.error(`❌ Invalid environment: ${environment}`)
  console.log(
    'Usage: yarn tsx scripts/generate-long-lived-token.ts [local|prod|production]',
  )
  console.log('Examples:')
  console.log('  yarn tsx scripts/generate-long-lived-token.ts local')
  console.log('  yarn tsx scripts/generate-long-lived-token.ts prod')
  console.log('Run with --help for more information')
  process.exit(1)
}

// Check if the environment file exists
if (!fs.existsSync(envPath)) {
  console.error(`❌ Environment file not found: ${envPath}`)
  console.log('Please ensure the file exists or use a different environment.')
  process.exit(1)
}

// Load the environment file
dotenv.config({ path: envPath })

// NOW import packages that depend on environment variables
import { UserRole } from '@pika/types'
import { PrismaClient } from '@prisma/client'
import { keyManager } from '@pika/crypto'
import jwt from 'jsonwebtoken'

// Debug: Check if JWT keys are loaded
console.log('JWT_ALGORITHM:', process.env.JWT_ALGORITHM)
console.log('JWT_PRIVATE_KEY exists:', !!process.env.JWT_PRIVATE_KEY)
console.log('JWT_ISSUER:', process.env.JWT_ISSUER)
console.log('JWT_AUDIENCE:', process.env.JWT_AUDIENCE)

const prisma = new PrismaClient()

async function generateTokensForTestUsers() {
  console.log('🎫 Generating year-long JWT tokens for test users...\n')

  // Initialize KeyManager before generating tokens
  if (!keyManager.isInitialized()) {
    await keyManager.initialize()
  }

  try {
    // Find the admin user from the test setup
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    const customerUser = await prisma.user.findUnique({
      where: { email: 'customer@example.com' },
    })

    const businessUser = await prisma.user.findUnique({
      where: { email: 'business@example.com' },
    })

    const users = [
      { user: adminUser, label: 'Admin User' },
      { user: customerUser, label: 'Customer User' },
      { user: businessUser, label: 'Business User' },
    ]

    for (const { user, label } of users) {
      if (!user) {
        console.log(`❌ ${label} not found. Run setup-test-users.ts first.`)
        continue
      }

      try {
        const now = Math.floor(Date.now() / 1000)
        const oneYear = 365 * 24 * 60 * 60 // 1 year in seconds

        const payload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          type: 'access',
          iat: now,
          exp: now + oneYear,
          sub: user.id,
          jti: `${user.id}-${now}-year-long-access`,
        }

        // Get the private key from KeyManager (already in PEM format)
        const privateKey = keyManager.getJWTPrivateKeyPEM()

        const token = jwt.sign(payload, privateKey, {
          algorithm: process.env.JWT_ALGORITHM as jwt.Algorithm,
          issuer: process.env.JWT_ISSUER || 'pika-api',
          audience: process.env.JWT_AUDIENCE || 'the_voucherbook_app',
        })

        console.log(`✅ ${label} Token:`)
        console.log(`   Email: ${user.email}`)
        console.log(`   User ID: ${user.id}`)
        console.log(`   Role: ${user.role}`)
        console.log(
          `   Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
        )
        console.log(`   Token: ${token}`)
        console.log()
      } catch (error) {
        console.error(`❌ Failed to generate token for ${user.email}:`, error)
      }
    }

    // Save tokens to file
    const tokensData = {
      generated: new Date().toISOString(),
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      environment: environment,
      tokens: users
        .filter(({ user }) => user !== null)
        .map(({ user, label }) => {
          const now = Math.floor(Date.now() / 1000)
          const oneYear = 365 * 24 * 60 * 60
          const payload = {
            userId: user!.id,
            email: user!.email,
            role: user!.role,
            status: user!.status || 'active',
            type: 'access',
            iat: now,
            exp: now + oneYear,
            sub: user!.id,
            jti: `${user!.id}-${now}-year-long-access`,
          }
          // Get the private key from KeyManager
          const privateKey = keyManager.getJWTPrivateKeyPEM()
          const token = jwt.sign(payload, privateKey, {
            algorithm: process.env.JWT_ALGORITHM as jwt.Algorithm,
            issuer: process.env.JWT_ISSUER || 'pika-api',
            audience: process.env.JWT_AUDIENCE || 'the_voucherbook_app',
          })

          return {
            label,
            email: user!.email,
            userId: user!.id,
            role: user!.role,
            token,
          }
        }),
    }

    const tokensFile = path.join(
      process.cwd(),
      `test-tokens-${environment}.json`,
    )
    fs.writeFileSync(tokensFile, JSON.stringify(tokensData, null, 2))

    console.log('📋 Usage Instructions:')
    console.log('====================')
    console.log('1. Copy any token above')
    console.log(
      '2. Use in API requests with header: Authorization: Bearer <token>',
    )
    console.log('3. Token is valid for 1 year from generation time')
    console.log(
      '4. Use admin token for admin endpoints, customer for public endpoints',
    )
    console.log(`5. Tokens saved to: ${tokensFile}`)
    console.log(`6. Generated using environment: ${environment} (${envPath})`)
    console.log('\n✨ Token generation complete!')
  } catch (error) {
    console.error('Failed to generate tokens:', error)
  }
}

// Run if called directly
import { fileURLToPath } from 'url'

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)

if (isMainModule) {
  generateTokensForTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Token generation failed:', error)
      process.exit(1)
    })
    .finally(() => {
      keyManager.clear() // Clear KeyManager after use
      prisma.$disconnect()
    })
}

export { generateTokensForTestUsers }
