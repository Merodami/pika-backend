/**
 * Main seed entry point for Pika database
 * Orchestrates the seeding process in the correct order with proper dependencies
 */

import { SEED_CLEAR_DATABASE } from '@pika/environment'
import { PrismaClient } from '@prisma/client'

import { seedCategories } from './seeders/category.seeder.js'
import { seedCustomers } from './seeders/customer.seeder.js'
import { seedProviders } from './seeders/provider.seeder.js'
import { seedUsers } from './seeders/user.seeder.js'
import { clearDatabase } from './utils/database.utils.js'
import { logger } from './utils/logger.js'

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  logger.info('Starting database seeding process...')

  // Create a Prisma client instance
  const prisma = new PrismaClient()

  try {
    // Clear database if needed (configurable)
    if (SEED_CLEAR_DATABASE) {
      logger.info('Clearing existing data...')
      await clearDatabase(prisma)
    }

    // Execute seeders in the correct order to maintain dependencies

    // Step 1: Create users (both customers and service providers)
    logger.info('Seeding users...')

    const { users, adminUsers, customerUsers, providerUsers } = await seedUsers(prisma)

    logger.success(`Created ${users.length} users (${adminUsers.length} admins, ${customerUsers.length} customers, ${providerUsers.length} providers)`)

    // Step 2: Create customer profiles for users with CUSTOMER role
    logger.info('Seeding customer profiles...')

    const { customers } = await seedCustomers(prisma, { customerUsers })

    logger.success(`Created ${customers.length} customer profiles`)

    // Step 3: Create categories (required for service providers and vouchers)
    logger.info('Seeding categories...')

    const { categories, rootCategories, subCategories } = await seedCategories(prisma)

    logger.success(`Created ${categories.length} categories (${rootCategories.length} root, ${subCategories.length} sub-categories)`)

    // Step 4: Create service provider profiles (needs users and categories)
    logger.info('Seeding service providers...')

    const { providers } = await seedProviders(prisma, {
      providerUsers,
      categories
    })

    logger.success(`Created ${providers.length} service provider profiles`)


    logger.success('✅ Database seeding completed successfully!')

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