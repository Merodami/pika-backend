import type { PrismaClient } from '@prisma/client'

import { FIXED_DEV_IDS } from './fixed-ids.js'
import type { ImageSeedingResult } from './image-seeder.js'
import { getRandomBusinessImage } from './image-seeder.js'

/**
 * Business Seeder Module
 * Creates 2 businesses for the dev user with complete translations
 */

const DEV_BUSINESSES_DATA = [
  {
    id: FIXED_DEV_IDS.businesses.restaurant,
    userId: FIXED_DEV_IDS.user,
    businessNameKey: 'dev.business.restaurant.name',
    businessDescriptionKey: 'dev.business.restaurant.description',
    categoryId: FIXED_DEV_IDS.categories.restaurants,
    verified: true,
    active: true,
    approved: true,
    avgRating: 4.5,
    translations: {
      name: {
        es: 'Restaurante El Sabor',
        en: 'The Flavor Restaurant',
        gn: "Tembi'u Renda Hese",
      },
      description: {
        es: 'Restaurante de comida tradicional paraguaya con ambiente familiar',
        en: 'Traditional Paraguayan food restaurant with family atmosphere',
        gn: "Paraguái tembi'u tee renda familia rehegua",
      },
    },
  },
  {
    id: FIXED_DEV_IDS.businesses.beautySalon,
    userId: FIXED_DEV_IDS.user,
    businessNameKey: 'dev.business.beauty.name',
    businessDescriptionKey: 'dev.business.beauty.description',
    categoryId: FIXED_DEV_IDS.categories.beauty,
    verified: true,
    active: true,
    approved: true,
    avgRating: 4.8,
    translations: {
      name: {
        es: 'Belleza & Estilo',
        en: 'Beauty & Style',
        gn: 'Iporã ha Estilo',
      },
      description: {
        es: 'Salón de belleza y spa con servicios integrales de cuidado personal',
        en: 'Beauty salon and spa with comprehensive personal care services',
        gn: 'Iporã salon ha spa ojeporu hag̃ua ñe ñongatu',
      },
    },
  },
] as const

export async function seedBusinesses(
  prisma: PrismaClient, 
  images?: ImageSeedingResult
): Promise<void> {
  console.log('🏢 Seeding dev businesses...')

  let businessesCreated = 0
  let translationsCreated = 0

  try {
    for (const businessData of DEV_BUSINESSES_DATA) {
      const { translations, ...business } = businessData

      // Assign a business image if available
      const logoUrl = images && images.businessImages.length > 0 
        ? getRandomBusinessImage(images.businessImages)
        : undefined

      // Create/update business
      const createdBusiness = await prisma.business.upsert({
        where: { id: business.id },
        update: {
          businessNameKey: business.businessNameKey,
          businessDescriptionKey: business.businessDescriptionKey,
          categoryId: business.categoryId,
          verified: business.verified,
          active: business.active,
          approved: business.approved,
          avgRating: business.avgRating,
          ...(logoUrl && { logoUrl }),
        },
        create: {
          ...business,
          ...(logoUrl && { logoUrl }),
        },
      })

      businessesCreated++

      // Create translations for business name
      for (const [langCode, value] of Object.entries(translations.name)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: business.businessNameKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: business.businessNameKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }

      // Create translations for business description
      for (const [langCode, value] of Object.entries(translations.description)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: business.businessDescriptionKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: business.businessDescriptionKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }

      console.log(`  ✅ ${translations.name.en}`)
    }

    console.log(`✅ Businesses seeded successfully:`)
    console.log(`   - ${businessesCreated} businesses created/updated`)
    console.log(`   - ${translationsCreated} translations created/updated`)
    console.log(`   - All businesses verified and approved`)

  } catch (error) {
    console.error('❌ Failed to seed businesses:', error)
    throw error
  }
}

export async function cleanupBusinesses(prisma: PrismaClient): Promise<void> {
  console.log('🗑️ Cleaning up dev businesses...')

  try {
    const businessIds = Object.values(FIXED_DEV_IDS.businesses)

    // Delete business translations
    const businessKeys = DEV_BUSINESSES_DATA.flatMap(b => [b.businessNameKey, b.businessDescriptionKey])
    const deletedTranslations = await prisma.translation.deleteMany({
      where: { key: { in: businessKeys } },
    })

    // Delete businesses
    const deletedBusinesses = await prisma.business.deleteMany({
      where: { id: { in: businessIds } },
    })

    console.log(`✅ Businesses cleanup completed:`)
    console.log(`   - ${deletedBusinesses.count} businesses deleted`)
    console.log(`   - ${deletedTranslations.count} translations deleted`)

  } catch (error) {
    console.error('❌ Failed to cleanup businesses:', error)
    throw error
  }
}

export async function checkBusinesses(prisma: PrismaClient): Promise<boolean> {
  try {
    const businessIds = Object.values(FIXED_DEV_IDS.businesses)
    const businesses = await prisma.business.findMany({
      where: { id: { in: businessIds } },
      select: {
        id: true,
        businessNameKey: true,
        active: true,
        verified: true,
        approved: true,
      },
    })

    console.log(`📊 Businesses status: ${businesses.length}/${businessIds.length} found`)

    if (businesses.length === businessIds.length) {
      console.log(`✅ All businesses exist`)
      businesses.forEach(b => {
        console.log(`   - ${b.businessNameKey}: active=${b.active}, verified=${b.verified}, approved=${b.approved}`)
      })

      return true
    } else {
      console.log(`⚠️ Missing ${businessIds.length - businesses.length} businesses`)

      return false
    }
  } catch (error) {
    console.error('❌ Failed to check businesses:', error)

    return false
  }
}

export const BUSINESS_MODULE = {
  name: 'Businesses',
  description: '2 businesses (restaurant & beauty salon) with translations',
  seed: seedBusinesses,
  cleanup: cleanupBusinesses,
  check: checkBusinesses,
  dependencies: ['User', 'Categories'], // Needs user and categories
} as const