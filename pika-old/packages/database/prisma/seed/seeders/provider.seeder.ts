/**
 * Service Provider seeder
 * Creates service provider profiles for users with PROVIDER role
 */

import { faker } from '@faker-js/faker'
import { Category, PrismaClient, Provider, User } from '@prisma/client'

import { createMultilingualText, type MultilingualText } from '../utils/data.utils.js'
import { logger } from '../utils/logger.js'

/**
 * Options for service provider seeder
 */
export interface ProviderSeederOptions {
  providerUsers: User[]
  categories: Category[]
}

/**
 * Result interface for service provider seeder
 */
export interface ProviderSeederResult {
  providers: Provider[]
}

/**
 * Seeds service provider profiles
 * @param prisma - Prisma client instance
 * @param options - Service provider options
 * @returns Created service provider profiles
 */
export async function seedProviders(
  prisma: PrismaClient,
  options: ProviderSeederOptions
): Promise<ProviderSeederResult> {
  const { providerUsers, categories } = options
  const providers: Provider[] = []

  // Create service provider profiles for each provider user
  for (const user of providerUsers) {
    try {
      // Select a random category for this provider
      const randomCategory = faker.helpers.arrayElement(categories)

      // Create business name and description as multilingual content
      const businessName: MultilingualText = createMultilingualText(
        `${user.firstName}'s ${faker.company.name()}`,
        {},
        (text, lang) => {
          if (lang === 'es') return `Negocio de ${user.firstName} - ${faker.company.buzzPhrase()}`
          if (lang === 'en') return text

          return `${user.firstName} ${faker.company.name()} (${lang.toUpperCase()})`
        }
      )

      const businessDescription: MultilingualText = createMultilingualText(
        faker.company.catchPhrase(),
        {},
        (text, lang) => {
          if (lang === 'es') return faker.company.catchPhrase()
          if (lang === 'en') return text

          return `${faker.company.buzzPhrase()} (${lang.toUpperCase()})`
        }
      )

      // Create service provider profile
      const provider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName,
          businessDescription,
          categoryId: randomCategory.id,
          verified: faker.datatype.boolean(0.7), // 70% verified
          active: true,
          avgRating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 })
        }
      })

      // Create availability records for this provider
      await createProviderAvailability(prisma, provider.id)

      providers.push(provider)
      logger.debug(`Created service provider profile for user: ${user.email}`)
    } catch (error) {
      logger.error(`Failed to create service provider profile for user ${user.email}:`, error)
    }
  }

  return { providers }
}

/**
 * Creates availability entries for a service provider
 * @param prisma - Prisma client instance
 * @param providerId - ID of the service provider
 */
async function createProviderAvailability(
  prisma: PrismaClient,
  providerId: string
): Promise<void> {
  // Create availability entries for each day of the week (0-6, Sunday to Saturday)
  // Most providers will be available Monday to Friday (1-5)
  const startDay = faker.helpers.maybe(() => 0, { probability: 0.3 }) ?? 1 // 30% chance to include Sunday
  const endDay = faker.helpers.maybe(() => 6, { probability: 0.4 }) ?? 5 // 40% chance to include Saturday

  for (let dayOfWeek = startDay; dayOfWeek <= endDay; dayOfWeek++) {
    // Morning shift (8am-12pm)
    await prisma.availability.create({
      data: {
        providerId,
        dayOfWeek,
        startTime: '08:00',
        endTime: '12:00'
      }
    })

    // Afternoon shift (2pm-6pm)
    await prisma.availability.create({
      data: {
        providerId,
        dayOfWeek,
        startTime: '14:00',
        endTime: '18:00'
      }
    })
  }
}