#!/usr/bin/env tsx

import { UserRole } from '@pika/types'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function generateTokensForTestUsers() {
  console.log('🎫 Generating year-long JWT tokens for test users...\n')

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

        const privateKey = process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n')

        const token = jwt.sign(payload, privateKey, {
          algorithm: process.env.JWT_ALGORITHM as jwt.Algorithm,
          issuer: process.env.JWT_ISSUER || 'pika-api',
          audience: process.env.JWT_AUDIENCE || 'pika-app',
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
          const privateKey = process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n')
          const token = jwt.sign(payload, privateKey, {
            algorithm: process.env.JWT_ALGORITHM as jwt.Algorithm,
            issuer: process.env.JWT_ISSUER || 'pika-api',
            audience: process.env.JWT_AUDIENCE || 'pika-app',
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

    const tokensFile = path.join(process.cwd(), 'test-tokens.json')
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
    .finally(() => prisma.$disconnect())
}

export { generateTokensForTestUsers }
