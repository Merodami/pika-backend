import { PrismaClient } from '@prisma/client'

import { seedCategories } from './categories.js'

const prisma = new PrismaClient()

async function seedDevData() {
  console.log('🚀 Starting development database seeding...')
  console.log('⚠️  This will add fake categories for development purposes only!')

  try {
    // Seed categories with translations
    await seedCategories(prisma)

    // TODO: Add more dev-specific seeds here in the future:
    // - Fake users
    // - Fake businesses  
    // - Fake vouchers
    // - Fake transactions

    console.log('✅ Development database seeding completed successfully!')
    console.log('🎯 Your dev environment now has realistic fake categories to work with!')
  } catch (error) {
    console.error('❌ Development database seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedDevData().catch((error) => {
  console.error('❌ Dev seeding error:', error)
  process.exit(1)
})