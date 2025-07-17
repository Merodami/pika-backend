/**
 * Database utilities for seed operations
 */

import { PrismaClient } from '@prisma/client'

import { logger } from './logger.js'

/**
 * Clear all data from database tables in the correct order to avoid foreign key constraints
 * @param prisma - Prisma client instance
 */
export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  try {
    // Define schemas with their tables in dependency order (children before parents)
    const truncateOperations = [
      // First delete data from marketplace tables (most dependencies)
      `TRUNCATE TABLE "marketplace"."reviews" CASCADE;`,
      `TRUNCATE TABLE "marketplace"."availability" CASCADE;`,
      `TRUNCATE TABLE "marketplace"."providers" CASCADE;`,
      `TRUNCATE TABLE "marketplace"."categories" CASCADE;`,

      // Then payment tables
      `TRUNCATE TABLE "payments"."payments" CASCADE;`,
      `TRUNCATE TABLE "payments"."payment_methods" CASCADE;`,

      // Then user-related tables
      `TRUNCATE TABLE "users"."addresses" CASCADE;`,
      `TRUNCATE TABLE "users"."customers" CASCADE;`,

      // Auth tables
      `TRUNCATE TABLE "auth"."user_identities" CASCADE;`,

      // Audit tables
      `TRUNCATE TABLE "audit"."audit_logs" CASCADE;`,

      // Finally the users table (referenced by most other tables)
      `TRUNCATE TABLE "users"."users" CASCADE;`,
    ]

    // Execute all truncate operations
    for (const operation of truncateOperations) {
      try {
        await prisma.$executeRawUnsafe(operation)
        logger.debug(`Successfully executed: ${operation}`)
      } catch (error) {
        if (error instanceof Error) {
          logger.warn(`Error executing: ${operation}`, error.message)
        } else {
          logger.warn(`Error executing: ${operation}`, String(error))
        }
        // Continue with other operations even if one fails
      }
    }

    logger.success('Database cleared successfully')
  } catch (error) {
    logger.error('Failed to clear database', error)
    throw error
  }
}

/**
 * Database statistics interface
 */
interface DatabaseStats {
  users: number
  customers: number
  providers: number
  categories: number
  vouchers: number
}

/**
 * Get counts for common tables to check seeding results
 * @param prisma - Prisma client instance
 */
export async function getDatabaseStats(prisma: PrismaClient): Promise<DatabaseStats> {
  const stats = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    providers: await prisma.provider.count(),
    categories: await prisma.category.count(),
    vouchers: await prisma.voucher.count(),
  }

  return stats
}