import type { PrismaClient } from '@prisma/client'
import { FIXED_DEV_IDS } from './fixed-ids.js'

/**
 * Category Seeder Module
 * Creates 10 categories with complete translations (ES, EN, GN)
 */

const DEV_CATEGORIES_DATA = [
  {
    id: FIXED_DEV_IDS.categories.restaurants,
    nameKey: 'dev.category.restaurants.name',
    descriptionKey: 'dev.category.restaurants.description',
    icon: 'restaurant',
    slug: 'dev-restaurants',
    sortOrder: 1,
    translations: {
      name: {
        es: 'Restaurantes',
        en: 'Restaurants',
        gn: "Tembi'u Renda",
      },
      description: {
        es: 'Restaurantes y establecimientos gastronómicos',
        en: 'Restaurants and gastronomic establishments',
        gn: "Tembi'u renda ha gastronomía renda",
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.fastFood,
    nameKey: 'dev.category.fast-food.name',
    descriptionKey: 'dev.category.fast-food.description',
    icon: 'fastfood',
    slug: 'dev-fast-food',
    sortOrder: 2,
    translations: {
      name: {
        es: 'Comida Rápida',
        en: 'Fast Food',
        gn: "Tembi'u Pya'e",
      },
      description: {
        es: 'Restaurantes de servicio rápido y comida para llevar',
        en: 'Quick service restaurants and takeaway food',
        gn: "Tembi'u pya'e ha ojegueraha",
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.cafes,
    nameKey: 'dev.category.cafes.name',
    descriptionKey: 'dev.category.cafes.description',
    icon: 'coffee',
    slug: 'dev-cafes',
    sortOrder: 3,
    translations: {
      name: {
        es: 'Cafeterías',
        en: 'Cafés',
        gn: 'Kafé Renda',
      },
      description: {
        es: 'Cafeterías, panaderías y pastelerías',
        en: 'Coffee shops, bakeries and pastry stores',
        gn: 'Kafé renda, mbujape renda ha dulce renda',
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.beauty,
    nameKey: 'dev.category.beauty.name',
    descriptionKey: 'dev.category.beauty.description',
    icon: 'face',
    slug: 'dev-beauty',
    sortOrder: 4,
    translations: {
      name: {
        es: 'Belleza y Bienestar',
        en: 'Beauty & Wellness',
        gn: 'Iporã ha Resapy',
      },
      description: {
        es: 'Salones de belleza, spas y servicios de bienestar',
        en: 'Beauty salons, spas and wellness services',
        gn: 'Iporã salon, spa ha resapy mbohapy',
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.fitness,
    nameKey: 'dev.category.fitness.name',
    descriptionKey: 'dev.category.fitness.description',
    icon: 'fitness_center',
    slug: 'dev-fitness',
    sortOrder: 5,
    translations: {
      name: {
        es: 'Fitness y Deportes',
        en: 'Fitness & Sports',
        gn: 'Ejercicio ha Ñembosarai',
      },
      description: {
        es: 'Gimnasios, clubes deportivos y centros de fitness',
        en: 'Gyms, sports clubs and fitness centers',
        gn: 'Gimnasio, ñembosarai club ha ejercicio renda',
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.retail,
    nameKey: 'dev.category.retail.name',
    descriptionKey: 'dev.category.retail.description',
    icon: 'shopping_bag',
    slug: 'dev-retail',
    sortOrder: 6,
    translations: {
      name: {
        es: 'Tiendas y Retail',
        en: 'Stores & Retail',
        gn: 'Ñemuhenda ha Retail',
      },
      description: {
        es: 'Tiendas, boutiques y comercios al por menor',
        en: 'Stores, boutiques and retail businesses',
        gn: 'Ñemuhenda, boutique ha negocio ñemuhenda',
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.automotive,
    nameKey: 'dev.category.automotive.name',
    descriptionKey: 'dev.category.automotive.description',
    icon: 'directions_car',
    slug: 'dev-automotive',
    sortOrder: 7,
    translations: {
      name: {
        es: 'Automotriz',
        en: 'Automotive',
        gn: 'Auto ha Moto',
      },
      description: {
        es: 'Servicios automotrices, talleres y repuestos',
        en: 'Automotive services, workshops and spare parts',
        gn: 'Auto mbohapy, taller ha repuesto',
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.healthcare,
    nameKey: 'dev.category.healthcare.name',
    descriptionKey: 'dev.category.healthcare.description',
    icon: 'local_hospital',
    slug: 'dev-healthcare',
    sortOrder: 8,
    translations: {
      name: {
        es: 'Salud',
        en: 'Healthcare',
        gn: 'Resapy',
      },
      description: {
        es: 'Servicios médicos, clínicas y farmacias',
        en: 'Medical services, clinics and pharmacies',
        gn: 'Pohã mbohapy, klinika ha farmacia',
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.entertainment,
    nameKey: 'dev.category.entertainment.name',
    descriptionKey: 'dev.category.entertainment.description',
    icon: 'movie',
    slug: 'dev-entertainment',
    sortOrder: 9,
    translations: {
      name: {
        es: 'Entretenimiento',
        en: 'Entertainment',
        gn: "Vy'a",
      },
      description: {
        es: 'Cines, teatros y lugares de entretenimiento',
        en: 'Cinemas, theaters and entertainment venues',
        gn: "Ta'anga jehecha, teatro ha vy'a renda",
      },
    },
  },
  {
    id: FIXED_DEV_IDS.categories.education,
    nameKey: 'dev.category.education.name',
    descriptionKey: 'dev.category.education.description',
    icon: 'school',
    slug: 'dev-education',
    sortOrder: 10,
    translations: {
      name: {
        es: 'Educación',
        en: 'Education',
        gn: 'Mboesapy',
      },
      description: {
        es: 'Escuelas, universidades y servicios educativos',
        en: 'Schools, universities and educational services',
        gn: 'Mboehao, universidad ha mboesapy mbohapy',
      },
    },
  },
] as const

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  console.log('🏷️ Seeding dev categories...')
  
  let categoriesCreated = 0
  let translationsCreated = 0
  
  try {
    for (const categoryData of DEV_CATEGORIES_DATA) {
      const { id, nameKey, descriptionKey, icon, slug, sortOrder, translations } = categoryData
      
      // Create/update category
      const category = await prisma.category.upsert({
        where: { id },
        update: {
          nameKey,
          descriptionKey,
          icon,
          sortOrder,
          isActive: true,
        },
        create: {
          id,
          nameKey,
          descriptionKey,
          icon,
          sortOrder,
          isActive: true,
          level: 1,
          path: '',
          slug,
          createdBy: FIXED_DEV_IDS.user,
        },
      })
      
      categoriesCreated++
      
      // Create translations for name
      for (const [langCode, value] of Object.entries(translations.name)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: nameKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: nameKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }
      
      // Create translations for description
      for (const [langCode, value] of Object.entries(translations.description)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: descriptionKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: descriptionKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }
      
      console.log(`  ✅ ${translations.name.en}`)
    }
    
    console.log(`✅ Categories seeded successfully:`)
    console.log(`   - ${categoriesCreated} categories created/updated`)
    console.log(`   - ${translationsCreated} translations created/updated`)
    console.log(`   - Languages: ES, EN, GN`)
    
  } catch (error) {
    console.error('❌ Failed to seed categories:', error)
    throw error
  }
}

export async function cleanupCategories(prisma: PrismaClient): Promise<void> {
  console.log('🗑️ Cleaning up dev categories...')
  
  try {
    const categoryIds = Object.values(FIXED_DEV_IDS.categories)
    
    // Delete category translations
    const categoryKeys = DEV_CATEGORIES_DATA.flatMap(c => [c.nameKey, c.descriptionKey])
    const deletedTranslations = await prisma.translation.deleteMany({
      where: { key: { in: categoryKeys } },
    })
    
    // Delete categories
    const deletedCategories = await prisma.category.deleteMany({
      where: { id: { in: categoryIds } },
    })
    
    console.log(`✅ Categories cleanup completed:`)
    console.log(`   - ${deletedCategories.count} categories deleted`)
    console.log(`   - ${deletedTranslations.count} translations deleted`)
    
  } catch (error) {
    console.error('❌ Failed to cleanup categories:', error)
    throw error
  }
}

export async function checkCategories(prisma: PrismaClient): Promise<boolean> {
  try {
    const categoryIds = Object.values(FIXED_DEV_IDS.categories)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, nameKey: true, isActive: true },
    })
    
    console.log(`📊 Categories status: ${categories.length}/${categoryIds.length} found`)
    
    if (categories.length === categoryIds.length) {
      console.log(`✅ All categories exist`)
      return true
    } else {
      console.log(`⚠️ Missing ${categoryIds.length - categories.length} categories`)
      return false
    }
  } catch (error) {
    console.error('❌ Failed to check categories:', error)
    return false
  }
}

export const CATEGORY_MODULE = {
  name: 'Categories',
  description: '10 categories with ES/EN/GN translations',
  seed: seedCategories,
  cleanup: cleanupCategories,
  check: checkCategories,
  dependencies: ['User'], // Needs user for createdBy field
} as const