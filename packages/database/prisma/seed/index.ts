/**
 * Main seed entry point for Pika database
 * Orchestrates the seeding process in the correct order with proper dependencies
 */

import { SEED_CLEAR_DATABASE } from '@pika/environment'
import { PrismaClient } from '@prisma/client'

import { seedGyms } from './seeders/gym.seeder.js'
import { seedPayments } from './seeders/payment.seeder.js'
import { seedSessions } from './seeders/session.seeder.js'
import { seedSocial } from './seeders/social.seeder.js'
import { seedSupport } from './seeders/support.seeder.js'
import { seedTemplates } from './seeders/template.seeder.js'
import { seedUsers } from './seeders/user.seeder.js'
import { clearDatabase } from './utils/database.utils.js'
import { logger } from './utils/logger.js'

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  logger.info('🌱 Starting comprehensive database seeding...')

  const startTime = Date.now()
  const prisma = new PrismaClient()

  try {
    // Clear database if needed
    if (SEED_CLEAR_DATABASE) {
      logger.info('🧹 Clearing existing data...')
      await clearDatabase(prisma)
    }

    // Step 1: Create users with all roles
    logger.info('👥 Step 1/7: Creating users...')

    const userResult = await seedUsers(prisma)
    const allUsers = userResult.users
    const professionals = [...userResult.professionalUsers, ...userResult.therapistUsers]

    logger.success(`✅ Created ${allUsers.length} users:`)
    logger.info(`   - ${userResult.adminUsers.length} admins`)
    logger.info(`   - ${userResult.memberUsers.length} members`)
    logger.info(`   - ${userResult.professionalUsers.length} professionals`)
    logger.info(`   - ${userResult.therapistUsers.length} therapists`)
    logger.info(`   - ${userResult.contentCreatorUsers.length} content creators`)

    // Step 2: Create gyms with equipment and reviews
    logger.info('🏋️ Step 2/7: Creating gyms...')

    const { gyms } = await seedGyms(prisma, allUsers)

    logger.success(`✅ Created ${gyms.length} gyms with equipment, amenities, and reviews`)

    // Step 3: Create sessions with bookings and reviews
    logger.info('📅 Step 3/7: Creating sessions...')

    const { sessions } = await seedSessions(prisma, professionals, allUsers, gyms)

    logger.success(`✅ Created ${sessions.length} sessions with bookings and reviews`)

    // Step 4: Create social connections and activities
    logger.info('🤝 Step 4/7: Creating social connections...')
    await seedSocial(prisma, allUsers, sessions, gyms)
    logger.success('✅ Created follows, friends, activities, and interactions')

    // Step 5: Create payment data
    logger.info('💳 Step 5/7: Creating payment data...')
    await seedPayments(prisma, allUsers)
    logger.success('✅ Created subscription plans, credit packs, and user subscriptions')

    // Step 6: Create support tickets
    logger.info('🎫 Step 6/7: Creating support tickets...')
    await seedSupport(prisma, allUsers)
    logger.success('✅ Created support problems and comments')

    // Step 7: Create session templates
    logger.info('📋 Step 7/7: Creating session templates...')
    await seedTemplates(prisma, professionals)
    logger.success('✅ Created session templates')

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    logger.success(`\n🎉 Database seeding completed successfully in ${duration}s!`)

    // Print test credentials
    logger.info('\n📝 Test User Credentials:')
    logger.info('   Admin: admin@pikain123!')
    logger.info('   Member: member@pikaber123!')
    logger.info('   Trainer: trainer@pikainer123!')
    logger.info('   Therapist: therapist@pikarapist123!')
    logger.info('   Creator: creator@pikaator123!')

  } catch (error) {
    logger.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the seed function
seed()
  .catch((error) => {
    logger.error('Unhandled error during seeding:', error)
    process.exit(1)
  })