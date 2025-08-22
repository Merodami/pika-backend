import type { PrismaClient } from '@prisma/client'
import { USER_MODULE } from './user-seeder.js'
import { CATEGORY_MODULE } from './category-seeder.js'
import { BUSINESS_MODULE } from './business-seeder.js'
import { VOUCHER_MODULE } from './voucher-seeder.js'

/**
 * Modular Development Data Orchestrator
 * Allows selective execution of seeding modules with dependency management
 */

// All available modules in dependency order
const ALL_MODULES = [
  USER_MODULE,
  CATEGORY_MODULE,
  BUSINESS_MODULE,
  VOUCHER_MODULE,
] as const

type ModuleName = typeof ALL_MODULES[number]['name']
type SeedModule = typeof ALL_MODULES[number]

/**
 * Get module by name
 */
function getModule(name: ModuleName): SeedModule {
  const module = ALL_MODULES.find(m => m.name === name)
  if (!module) {
    throw new Error(`Module '${name}' not found`)
  }
  return module
}

/**
 * Resolve dependencies for a module
 */
function resolveDependencies(moduleName: ModuleName): ModuleName[] {
  const module = getModule(moduleName)
  const dependencies: ModuleName[] = []
  
  for (const depName of module.dependencies) {
    dependencies.push(...resolveDependencies(depName as ModuleName))
    if (!dependencies.includes(depName as ModuleName)) {
      dependencies.push(depName as ModuleName)
    }
  }
  
  return dependencies
}

/**
 * Get execution order for modules (with dependencies)
 */
function getExecutionOrder(moduleNames: ModuleName[]): ModuleName[] {
  const order: ModuleName[] = []
  
  for (const moduleName of moduleNames) {
    const dependencies = resolveDependencies(moduleName)
    
    // Add dependencies first
    for (const dep of dependencies) {
      if (!order.includes(dep)) {
        order.push(dep)
      }
    }
    
    // Add the module itself
    if (!order.includes(moduleName)) {
      order.push(moduleName)
    }
  }
  
  return order
}

/**
 * Seed specific modules with their dependencies
 */
export async function seedModules(
  prisma: PrismaClient,
  moduleNames: ModuleName[] = ['User', 'Categories', 'Businesses', 'Vouchers'],
  options: {
    verbose?: boolean
    skipExisting?: boolean
  } = {}
): Promise<void> {
  const { verbose = true, skipExisting = false } = options
  
  console.log('🚀 Starting modular development data seeding...')
  console.log(`📋 Requested modules: ${moduleNames.join(', ')}`)
  
  try {
    // Resolve execution order
    const executionOrder = getExecutionOrder(moduleNames)
    console.log(`🔗 Execution order: ${executionOrder.join(' → ')}`)
    
    if (verbose) {
      console.log('\\n📝 Module details:')
      for (const name of executionOrder) {
        const module = getModule(name)
        console.log(`  • ${module.name}: ${module.description}`)
        if (module.dependencies.length > 0) {
          console.log(`    Dependencies: ${module.dependencies.join(', ')}`)
        }
      }
      console.log('')
    }
    
    // Execute modules in order
    for (const moduleName of executionOrder) {
      const module = getModule(moduleName)
      
      console.log(`\\n🔄 Processing ${module.name}...`)
      
      // Check if module exists (if skip existing is enabled)
      if (skipExisting) {
        const exists = await module.check(prisma)
        if (exists) {
          console.log(`⏭️ Skipping ${module.name} (already exists)`)
          continue
        }
      }
      
      // Seed the module
      await module.seed(prisma)
      console.log(`✅ ${module.name} seeded successfully`)
    }
    
    console.log('\\n🎉 All modules seeded successfully!')
    console.log('\\n📊 Summary:')
    for (const moduleName of executionOrder) {
      await getModule(moduleName).check(prisma)
    }
    
  } catch (error) {
    console.error('❌ Failed to seed modules:', error)
    throw error
  }
}

/**
 * Cleanup specific modules (in reverse dependency order)
 */
export async function cleanupModules(
  prisma: PrismaClient,
  moduleNames: ModuleName[] = ['Vouchers', 'Businesses', 'Categories', 'User'],
  options: {
    verbose?: boolean
    skipMissing?: boolean
  } = {}
): Promise<void> {
  const { verbose = true, skipMissing = false } = options
  
  console.log('🧹 Starting modular development data cleanup...')
  console.log(`📋 Requested modules: ${moduleNames.join(', ')}`)
  
  try {
    // Cleanup in reverse order (to handle dependencies)
    const cleanupOrder = [...moduleNames].reverse()
    console.log(`🔗 Cleanup order: ${cleanupOrder.join(' → ')}`)
    
    if (verbose) {
      console.log('\\n📝 Module details:')
      for (const name of cleanupOrder) {
        const module = getModule(name)
        console.log(`  • ${module.name}: ${module.description}`)
      }
      console.log('')
    }
    
    // Execute cleanup for each module
    for (const moduleName of cleanupOrder) {
      const module = getModule(moduleName)
      
      console.log(`\\n🗑️ Cleaning ${module.name}...`)
      
      // Check if module exists (if skip missing is enabled)
      if (skipMissing) {
        const exists = await module.check(prisma)
        if (!exists) {
          console.log(`⏭️ Skipping ${module.name} (doesn't exist)`)
          continue
        }
      }
      
      // Cleanup the module
      await module.cleanup(prisma)
      console.log(`✅ ${module.name} cleaned successfully`)
    }
    
    console.log('\\n🎉 All modules cleaned successfully!')
    
  } catch (error) {
    console.error('❌ Failed to cleanup modules:', error)
    throw error
  }
}

/**
 * Check status of specific modules
 */
export async function checkModules(
  prisma: PrismaClient,
  moduleNames: ModuleName[] = ['User', 'Categories', 'Businesses', 'Vouchers']
): Promise<Record<ModuleName, boolean>> {
  console.log('🔍 Checking module status...')
  
  const results: Record<string, boolean> = {}
  
  for (const moduleName of moduleNames) {
    const module = getModule(moduleName)
    console.log(`\\n📊 ${module.name}:`)
    
    try {
      const exists = await module.check(prisma)
      results[moduleName] = exists
    } catch (error) {
      console.error(`❌ Failed to check ${moduleName}:`, error)
      results[moduleName] = false
    }
  }
  
  console.log('\\n📋 Module Status Summary:')
  console.log('========================')
  for (const [name, exists] of Object.entries(results)) {
    const status = exists ? '✅ EXISTS' : '❌ MISSING'
    console.log(`${name}: ${status}`)
  }
  
  return results as Record<ModuleName, boolean>
}

/**
 * Reset all dev data (cleanup + seed)
 */
export async function resetDevData(
  prisma: PrismaClient,
  options: {
    modules?: ModuleName[]
    verbose?: boolean
  } = {}
): Promise<void> {
  const { modules = ['User', 'Categories', 'Businesses', 'Vouchers'], verbose = true } = options
  
  console.log('🔄 Resetting development data...')
  console.log(`📋 Modules: ${modules.join(', ')}`)
  
  try {
    // First cleanup in reverse order
    await cleanupModules(prisma, [...modules].reverse(), { verbose })
    
    console.log('\\n⏸️ Cleanup completed, starting fresh seed...')
    
    // Then seed in dependency order
    await seedModules(prisma, modules, { verbose })
    
    console.log('\\n🎉 Development data reset completed!')
    
  } catch (error) {
    console.error('❌ Failed to reset development data:', error)
    throw error
  }
}

/**
 * Quick commands for common operations
 */
export const QUICK_COMMANDS = {
  /**
   * Seed everything
   */
  seedAll: (prisma: PrismaClient) => 
    seedModules(prisma, ['User', 'Categories', 'Businesses', 'Vouchers']),
  
  /**
   * Cleanup everything
   */
  cleanAll: (prisma: PrismaClient) => 
    cleanupModules(prisma, ['Vouchers', 'Businesses', 'Categories', 'User']),
  
  /**
   * Reset everything
   */
  resetAll: (prisma: PrismaClient) => 
    resetDevData(prisma),
  
  /**
   * Check everything
   */
  checkAll: (prisma: PrismaClient) => 
    checkModules(prisma, ['User', 'Categories', 'Businesses', 'Vouchers']),
  
  /**
   * Seed just user and categories (for basic testing)
   */
  seedBasic: (prisma: PrismaClient) => 
    seedModules(prisma, ['User', 'Categories']),
  
  /**
   * Seed business data (user + categories + businesses)
   */
  seedBusiness: (prisma: PrismaClient) => 
    seedModules(prisma, ['User', 'Categories', 'Businesses']),
  
} as const

// Export module constants for external use
export { ALL_MODULES }
export type { ModuleName, SeedModule }