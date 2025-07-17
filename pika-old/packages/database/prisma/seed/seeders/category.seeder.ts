/**
 * Category seeder
 * Creates root categories and subcategories for services
 */

import { faker } from '@faker-js/faker'
import { Category, PrismaClient } from '@prisma/client'

import { createMultilingualText, createSlug, type MultilingualText } from '../utils/data.utils.js'
import { logger } from '../utils/logger.js'
import { getSeedConfig } from '../utils/seed.constants.js'

/**
 * Result from category seeder
 */
export interface CategorySeederResult {
  categories: Category[]
  rootCategories: Category[]
  subCategories: Category[]
}

/**
 * Seeds service categories
 * @param prisma - Prisma client instance
 * @returns Created categories
 */
export async function seedCategories(prisma: PrismaClient): Promise<CategorySeederResult> {
  const config = getSeedConfig()
  const rootCategories: Category[] = []
  const subCategories: Category[] = []

  // Optional: Clear existing categories if needed
  try {
    logger.debug('Clearing existing categories...')
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "marketplace"."categories" CASCADE;`)
  } catch (error) {
    logger.warn('Failed to clear categories:', error)
  }

  // Create root categories first
  const rootCategoryNames = new Set<string>()

  // Generate unique root category names
  while (rootCategoryNames.size < config.ROOT_CATEGORIES_COUNT) {
    rootCategoryNames.add(faker.commerce.department())
  }

  // Create root categories
  for (const categoryName of rootCategoryNames) {
    try {
      // Create name and description as multilingual content
      const name: MultilingualText = createMultilingualText(categoryName)

      const description: MultilingualText = createMultilingualText(
        faker.commerce.productDescription(),
        {},
        (text, lang) => {
          if (lang === 'es') return text
          if (lang === 'en') return faker.commerce.productDescription()
          if (lang === 'gn') return `${faker.lorem.words(3)} guarani ${faker.lorem.paragraph(1)}`

          return text
        }
      )

      // Create unique slug from name
      const slug = createSlug(categoryName)

      // Create the root category
      const rootCategory = await prisma.category.create({
        data: {
          name,
          description,
          iconUrl: faker.image.urlLoremFlickr({ category: 'business' }),
          slug,
          level: 1, // Root level
          path: '',
          active: true,
          sortOrder: rootCategories.length
        }
      })

      rootCategories.push(rootCategory)
      logger.debug(`Created root category: ${categoryName} (${rootCategory.id})`)
    } catch (error) {
      logger.error(`Failed to create root category "${categoryName}":`, error)
    }
  }

  // Create subcategories distributed among root categories
  for (let i = 0; i < config.SUB_CATEGORIES_COUNT && rootCategories.length > 0; i++) {
    try {
      // Select a parent category (round-robin distribution)
      const parentCategory = rootCategories[i % rootCategories.length]

      // Create subcategory name
      const subcategoryName = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`

      // Create name and description as multilingual content
      const name: MultilingualText = createMultilingualText(subcategoryName)

      const description: MultilingualText = createMultilingualText(
        faker.commerce.productDescription(),
        {},
        (text, lang) => {
          if (lang === 'es') return text
          if (lang === 'en') return faker.commerce.productDescription()
          if (lang === 'gn') return `${faker.lorem.words(3)} guarani ${faker.lorem.paragraph(1)}`

          return text
        }
      )

      // Create unique slug from parent slug and subcategory name
      const slug = createSlug(`${parentCategory.slug}-${subcategoryName}`)

      // Create the subcategory
      const subCategory = await prisma.category.create({
        data: {
          name,
          description,
          iconUrl: faker.image.urlLoremFlickr({ category: 'business' }),
          slug,
          parentId: parentCategory.id,
          level: 2, // Subcategory level
          path: parentCategory.id, // Simple path for now
          active: true,
          sortOrder: i
        }
      })

      subCategories.push(subCategory)
      logger.debug(`Created subcategory: ${subcategoryName} under ${JSON.stringify(parentCategory.name)} (${subCategory.id})`)
    } catch (error) {
      logger.error(`Failed to create subcategory #${i}:`, error)
    }
  }

  // Combine all categories for return
  const categories = [...rootCategories, ...subCategories]

  return {
    categories,
    rootCategories,
    subCategories
  }
}