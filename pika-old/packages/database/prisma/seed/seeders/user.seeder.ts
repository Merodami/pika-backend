/**
 * User seeder
 * Creates users with different roles (admin, customer, service provider)
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client'

import { logger } from '../utils/logger.js'
import { getSeedConfig } from '../utils/seed.constants.js'

/**
 * Result interface for user seeder
 */
export interface UserSeederResult {
  users: User[]
  adminUsers: User[]
  customerUsers: User[]
  providerUsers: User[]
}

/**
 * Seeds users with different roles
 * @param prisma - Prisma client instance
 * @returns Created users categorized by role
 */
export async function seedUsers(prisma: PrismaClient): Promise<UserSeederResult> {
  const config = getSeedConfig()
  const users: User[] = []
  const adminUsers: User[] = []
  const customerUsers: User[] = []
  const providerUsers: User[] = []

  // Create admin users
  for (let i = 0; i < config.ADMIN_USERS_COUNT; i++) {
    try {
      const user = await createUser(prisma, {
        role: UserRole.ADMIN,
        email: i === 0 ? 'admin@pika.com' : faker.internet.email({ provider: 'pika.com' })
      })

      users.push(user)
      adminUsers.push(user)
      logger.debug(`Created admin user: ${user.email}`)
    } catch (error) {
      logger.error(`Failed to create admin user:`, error)
    }
  }

  // Create customer users
  for (let i = 0; i < config.CUSTOMER_USERS_COUNT; i++) {
    try {
      const user = await createUser(prisma, {
        role: UserRole.CUSTOMER,
        email: i === 0 ? 'customer@example.com' : undefined
      })

      users.push(user)
      customerUsers.push(user)
      logger.debug(`Created customer user: ${user.email}`)
    } catch (error) {
      logger.error(`Failed to create customer user:`, error)
    }
  }

  // Create service provider users
  for (let i = 0; i < config.PROVIDER_USERS_COUNT; i++) {
    try {
      const user = await createUser(prisma, {
        role: UserRole.PROVIDER,
        email: i === 0 ? 'provider@example.com' : undefined
      })

      users.push(user)
      providerUsers.push(user)
      logger.debug(`Created service provider user: ${user.email}`)
    } catch (error) {
      logger.error(`Failed to create service provider user:`, error)
    }
  }

  return {
    users,
    adminUsers,
    customerUsers,
    providerUsers
  }
}

/**
 * Options for creating a user
 */
interface CreateUserOptions {
  role?: UserRole
  status?: UserStatus
  email?: string
  firstName?: string
  lastName?: string
  password?: string
  phoneNumber?: string
}

/**
 * Creates a single user with specified or random data
 * @param prisma - Prisma client instance
 * @param options - User creation options
 * @returns Created user
 */
async function createUser(prisma: PrismaClient, options: CreateUserOptions = {}): Promise<User> {
  const firstName = options.firstName || faker.person.firstName()
  const lastName = options.lastName || faker.person.lastName()

  const user = await prisma.user.create({
    data: {
      email: options.email || faker.internet.email({ firstName, lastName }),
      emailVerified: faker.datatype.boolean(0.8), // 80% verified
      password: options.password || faker.internet.password({ length: 12 }),
      firstName,
      lastName,
      phoneNumber: options.phoneNumber || faker.phone.number(),
      phoneVerified: faker.datatype.boolean(0.6), // 60% verified
      avatarUrl: faker.image.avatar(),
      role: options.role || UserRole.CUSTOMER,
      status: options.status || UserStatus.ACTIVE,
      lastLoginAt: faker.date.recent(),
    }
  })

  return user
}