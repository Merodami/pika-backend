import { PrismaClient } from '@prisma/client'

import { seedCategories } from './categories.js'
import { QUICK_COMMANDS, seedModules, cleanupModules, checkModules, resetDevData } from './modules/orchestrator.js'

const prisma = new PrismaClient()

/**
 * Main development data seeding function
 * Now supports both legacy categories and new modular system
 */
async function seedDevData() {
  console.log('🚀 Starting development database seeding...')
  
  // Parse command line arguments
  const args = process.argv.slice(2)
  const command = args[0]
  const modules = args.slice(1)
  
  try {
    if (command === 'legacy') {
      // Legacy mode - just seed categories
      console.log('📚 Running in legacy mode (categories only)...')
      await seedCategories(prisma)
      console.log('✅ Legacy categories seeded successfully!')
      
    } else if (command === 'modular') {
      // New modular system
      console.log('🔧 Running in modular mode...')
      const moduleNames = modules.length > 0 ? modules as any[] : ['User', 'Categories', 'Businesses', 'Vouchers']
      await seedModules(prisma, moduleNames)
      
    } else if (command === 'cleanup') {
      // Cleanup modules
      console.log('🧹 Running cleanup...')
      const moduleNames = modules.length > 0 ? modules as any[] : ['Vouchers', 'Businesses', 'Categories', 'User']
      await cleanupModules(prisma, moduleNames)
      
    } else if (command === 'check') {
      // Check module status
      console.log('🔍 Checking module status...')
      const moduleNames = modules.length > 0 ? modules as any[] : ['User', 'Categories', 'Businesses', 'Vouchers']
      await checkModules(prisma, moduleNames)
      
    } else if (command === 'reset') {
      // Reset (cleanup + seed)
      console.log('🔄 Resetting development data...')
      const moduleNames = modules.length > 0 ? modules as any[] : ['User', 'Categories', 'Businesses', 'Vouchers']
      await resetDevData(prisma, { modules: moduleNames })
      
    } else if (command === 'quick') {
      // Quick commands
      const quickCommand = modules[0]
      console.log(`⚡ Running quick command: ${quickCommand}`)
      
      switch (quickCommand) {
        case 'seedAll':
          await QUICK_COMMANDS.seedAll(prisma)
          break
        case 'cleanAll':
          await QUICK_COMMANDS.cleanAll(prisma)
          break
        case 'resetAll':
          await QUICK_COMMANDS.resetAll(prisma)
          break
        case 'checkAll':
          await QUICK_COMMANDS.checkAll(prisma)
          break
        case 'seedBasic':
          await QUICK_COMMANDS.seedBasic(prisma)
          break
        case 'seedBusiness':
          await QUICK_COMMANDS.seedBusiness(prisma)
          break
        default:
          console.log('❌ Unknown quick command. Available: seedAll, cleanAll, resetAll, checkAll, seedBasic, seedBusiness')
          process.exit(1)
      }
      
    } else {
      // Default behavior - seed everything with new modular system
      console.log('🔧 Using new modular system (default)...')
      console.log('💡 Pro tip: Use these commands for more control:')
      console.log('   yarn seed:dev modular User Categories')
      console.log('   yarn seed:dev cleanup Vouchers')
      console.log('   yarn seed:dev check')
      console.log('   yarn seed:dev reset')
      console.log('   yarn seed:dev quick seedAll')
      console.log('')
      
      await QUICK_COMMANDS.seedAll(prisma)
    }
    
    console.log('\\n🎉 Development seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Development database seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Add help function
function showHelp() {
  console.log(`
🔧 VoucherBook Development Data Seeder
=====================================

Usage: yarn seed:dev [command] [modules...]

Commands:
  (no command)    - Seed all modules (default)
  modular         - Seed specific modules
  cleanup         - Cleanup specific modules  
  check           - Check module status
  reset           - Reset (cleanup + seed) modules
  legacy          - Use legacy category seeding only
  quick <cmd>     - Run quick command
  help            - Show this help

Modules (in dependency order):
  User           - Business owner user for testing
  Categories     - 10 categories with ES/EN/GN translations
  Businesses     - 2 businesses (restaurant & beauty salon)
  Vouchers       - 10 vouchers (5 per business) with translations

Quick Commands:
  seedAll        - Seed all modules
  cleanAll       - Cleanup all modules
  resetAll       - Reset all modules
  checkAll       - Check all modules
  seedBasic      - Seed just User + Categories
  seedBusiness   - Seed User + Categories + Businesses

Examples:
  yarn seed:dev                                # Seed everything
  yarn seed:dev modular User Categories        # Seed just user and categories
  yarn seed:dev cleanup Vouchers              # Cleanup just vouchers
  yarn seed:dev check                         # Check status of all modules
  yarn seed:dev reset Businesses Vouchers     # Reset businesses and vouchers
  yarn seed:dev quick seedBasic               # Quick seed basic modules
  yarn seed:dev legacy                        # Use legacy category system only
`)
}

// Handle help command
if (process.argv.includes('help') || process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
  process.exit(0)
}

seedDevData().catch((error) => {
  console.error('❌ Dev seeding error:', error)
  process.exit(1)
})