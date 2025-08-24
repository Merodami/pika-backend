import type { PrismaClient } from '@prisma/client'

import { FIXED_DEV_IDS } from './fixed-ids.js'
import type { ImageSeedingResult } from './image-seeder.js'
import { getRandomUserAvatar } from './image-seeder.js'

/**
 * User Seeder Module
 * Creates a business owner user for dev purposes
 */

const DEV_USER_DATA = {
  id: FIXED_DEV_IDS.user,
  email: 'dev-business@voucherbook.dev',
  emailVerified: true,
  password: '$2b$10$rZ3qJHlFQl8NJ4OD2McPguKLJQhGwj5CQxVhKNXI1vHpQrF5J3RDu', // DevPassword123!
  firstName: 'Business',
  lastName: 'Owner',
  phoneNumber: '+595981234567',
  phoneVerified: true,
  role: 'business' as const,
  status: 'active' as const,
} as const

export async function seedUser(
  prisma: PrismaClient,
  images?: ImageSeedingResult
): Promise<void> {
  console.log('👤 Seeding dev user...')

  try {
    // Assign a user avatar if available
    const avatarUrl = images && images.userAvatars.length > 0
      ? getRandomUserAvatar(images.userAvatars)
      : undefined

    const user = await prisma.user.upsert({
      where: { id: DEV_USER_DATA.id },
      update: {
        emailVerified: DEV_USER_DATA.emailVerified,
        firstName: DEV_USER_DATA.firstName,
        lastName: DEV_USER_DATA.lastName,
        phoneNumber: DEV_USER_DATA.phoneNumber,
        phoneVerified: DEV_USER_DATA.phoneVerified,
        role: DEV_USER_DATA.role,
        status: DEV_USER_DATA.status,
        avatarUrl,
      },
      create: {
        ...DEV_USER_DATA,
        avatarUrl,
      },
    })

    console.log(`✅ User created/updated: ${user.email}`)
    console.log(`   - Role: ${user.role}`)
    console.log(`   - Status: ${user.status}`)
    console.log(`   - Email Verified: ${user.emailVerified}`)

    return
  } catch (error) {
    console.error('❌ Failed to seed user:', error)
    throw error
  }
}

export async function cleanupUser(prisma: PrismaClient): Promise<void> {
  console.log('🗑️ Cleaning up dev user...')

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: FIXED_DEV_IDS.user },
    })

    if (!user) {
      console.log('ℹ️ User not found, nothing to cleanup')

      return
    }

    // Delete user (this will cascade to related entities)
    await prisma.user.delete({
      where: { id: FIXED_DEV_IDS.user },
    })

    console.log(`✅ User deleted: ${user.email}`)
  } catch (error) {
    console.error('❌ Failed to cleanup user:', error)
    throw error
  }
}

export async function checkUser(prisma: PrismaClient): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: FIXED_DEV_IDS.user },
      select: { id: true, email: true, role: true, status: true },
    })

    if (user) {
      console.log(`✅ User exists: ${user.email} (${user.role}, ${user.status})`)

      return true
    } else {
      console.log('❌ User not found')

      return false
    }
  } catch (error) {
    console.error('❌ Failed to check user:', error)

    return false
  }
}

export const USER_MODULE = {
  name: 'User',
  description: 'Business owner user for dev testing',
  seed: seedUser,
  cleanup: cleanupUser,
  check: checkUser,
  dependencies: [], // No dependencies
} as const