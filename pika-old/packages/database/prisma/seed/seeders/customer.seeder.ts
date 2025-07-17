/**
 * Customer seeder
 * Creates customer profiles for users with CUSTOMER role
 */

import { faker } from '@faker-js/faker'
import { Customer, PrismaClient, User } from '@prisma/client'

import { logger } from '../utils/logger.js'
import { SUPPORTED_LANGUAGES } from '../utils/seed.constants.js'

/**
 * Options for customer seeder
 */
export interface CustomerSeederOptions {
  customerUsers: User[]
}

/**
 * Result from customer seeder
 */
export interface CustomerSeederResult {
  customers: Customer[]
}

/**
 * Seeds customer profiles for users with CUSTOMER role
 * @param prisma - Prisma client instance
 * @param options - Customer seeder options
 * @returns Created customer profiles
 */
export async function seedCustomers(
  prisma: PrismaClient,
  options: CustomerSeederOptions
): Promise<CustomerSeederResult> {
  const { customerUsers } = options
  const customers: Customer[] = []

  // Create customer profiles for each customer user
  for (const user of customerUsers) {
    try {
      // Create customer preferences as JSON
      const preferences = {
        language: faker.helpers.arrayElement(SUPPORTED_LANGUAGES),
        notifications: faker.datatype.boolean(),
        theme: faker.helpers.arrayElement(['light', 'dark', 'system'])
      }

      // Create customer profile
      const customer = await prisma.customer.create({
        data: {
          userId: user.id,
          preferences
        }
      })

      customers.push(customer)
      logger.debug(`Created customer profile for user: ${user.email}`)
    } catch (error) {
      logger.error(`Failed to create customer profile for user ${user.email}:`, error)
    }
  }

  return { customers }
}