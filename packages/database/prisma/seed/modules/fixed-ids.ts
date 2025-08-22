import { v5 as uuidv5 } from 'uuid'

// Fixed namespace for generating predictable UUIDs for dev data
const DEV_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

/**
 * Generate predictable UUIDs for dev data
 * This ensures we can always find and cleanup our dev entities
 */
export const generateFixedUUID = (seed: string): string => {
  return uuidv5(seed, DEV_NAMESPACE)
}

/**
 * All fixed UUIDs for dev entities
 * Organized by module for easy management
 */
export const FIXED_DEV_IDS = {
  // User module
  user: generateFixedUUID('dev-business-owner'),
  
  // Category module - 10 categories
  categories: {
    restaurants: generateFixedUUID('dev-category-restaurants'),
    fastFood: generateFixedUUID('dev-category-fast-food'),
    cafes: generateFixedUUID('dev-category-cafes'),
    beauty: generateFixedUUID('dev-category-beauty'),
    fitness: generateFixedUUID('dev-category-fitness'),
    retail: generateFixedUUID('dev-category-retail'),
    automotive: generateFixedUUID('dev-category-automotive'),
    healthcare: generateFixedUUID('dev-category-healthcare'),
    entertainment: generateFixedUUID('dev-category-entertainment'),
    education: generateFixedUUID('dev-category-education'),
  },
  
  // Business module - 2 businesses
  businesses: {
    restaurant: generateFixedUUID('dev-business-restaurant'),
    beautySalon: generateFixedUUID('dev-business-beauty-salon'),
  },
  
  // Voucher module - 10 vouchers (5 per business)
  vouchers: {
    restaurant: {
      discount20: generateFixedUUID('dev-voucher-restaurant-discount-20'),
      freeDessert: generateFixedUUID('dev-voucher-restaurant-free-dessert'),
      familyCombo: generateFixedUUID('dev-voucher-restaurant-family-combo'),
      happyHour: generateFixedUUID('dev-voucher-restaurant-happy-hour'),
      birthday: generateFixedUUID('dev-voucher-restaurant-birthday'),
    },
    beauty: {
      firstVisit: generateFixedUUID('dev-voucher-beauty-first-visit'),
      spaPackage: generateFixedUUID('dev-voucher-beauty-spa-package'),
      hairTreatment: generateFixedUUID('dev-voucher-beauty-hair-treatment'),
      manicurePedicure: generateFixedUUID('dev-voucher-beauty-manicure-pedicure'),
      facialAntiAging: generateFixedUUID('dev-voucher-beauty-facial-anti-aging'),
    },
  },
} as const

/**
 * Get all IDs for a specific module
 */
export const getModuleIds = (module: keyof typeof FIXED_DEV_IDS) => {
  const moduleData = FIXED_DEV_IDS[module]
  
  if (typeof moduleData === 'string') {
    return [moduleData]
  }
  
  if (typeof moduleData === 'object') {
    const ids: string[] = []
    
    const collectIds = (obj: any): void => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          ids.push(value)
        } else if (typeof value === 'object') {
          collectIds(value)
        }
      }
    }
    
    collectIds(moduleData)
    return ids
  }
  
  return []
}

/**
 * Get all dev entity IDs across all modules
 */
export const getAllDevIds = (): string[] => {
  return Object.keys(FIXED_DEV_IDS).flatMap(key => 
    getModuleIds(key as keyof typeof FIXED_DEV_IDS)
  )
}