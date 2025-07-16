/**
 * Utility functions for generating seed data
 */

import { faker } from '@faker-js/faker'

/**
 * Creates a URL-friendly slug from a string
 * @param text - Text to convert to slug
 * @returns Slug string
 */
export function createSlug(text: string): string {
  // Convert to lowercase and replace spaces with hyphens
  const baseSlug = text
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')    // Remove leading and trailing hyphens

  // Add timestamp to ensure uniqueness
  return `${baseSlug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

/**
 * Generates a random time in 24hr HH:MM format
 * @param minHour - Minimum hour (0-23)
 * @param maxHour - Maximum hour (0-23)
 * @returns Time string in HH:MM format
 */
export function generateRandomTime(minHour = 8, maxHour = 20): string {
  const hour = faker.number.int({ min: minHour, max: maxHour })
  // Generate minutes in 15-minute intervals (0, 15, 30, 45)
  const minute = faker.helpers.arrayElement([0, 15, 30, 45])

  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

/**
 * Generates a random future date within specified range
 * @param minDays - Minimum days from now
 * @param maxDays - Maximum days from now
 * @returns Date object
 */
export function generateFutureDate(minDays = 1, maxDays = 30): Date {
  const daysToAdd = faker.number.int({ min: minDays, max: maxDays })
  const result = new Date()

  result.setDate(result.getDate() + daysToAdd)

  return result
}

/**
 * Picks a random number of random elements from an array
 * @param array - Source array
 * @param minItems - Minimum number of items to pick
 * @param maxItems - Maximum number of items to pick
 * @returns Array of randomly selected items
 */
export function pickRandomItems<T>(
  array: T[],
  minItems: number = 1,
  maxItems?: number
): T[] {
  if (array.length === 0) return []

  const max = maxItems ?? array.length
  const count = faker.number.int({
    min: Math.min(minItems, array.length),
    max: Math.min(max, array.length)
  })

  return faker.helpers.arrayElements(array, count)
}

/**
 * Generates a random phone number in US format
 * @returns Phone number string
 */
export function generatePhoneNumber(): string {
  // US mobile format: +1 XXX XXX XXXX
  const areaCode = faker.helpers.arrayElement(['555', '202', '212', '213', '214', '215', '216', '217', '218', '219', '220', '224', '225', '226', '227', '228'])
  const exchange = faker.string.numeric(3)
  const number = faker.string.numeric(4)

  return `+1${areaCode}${exchange}${number}`
}

/**
 * Generates random business hours
 * @returns Array of availability objects
 */
export function generateBusinessHours() {
  const days = [0, 1, 2, 3, 4, 5, 6] // Sunday to Saturday
  const businessDays = faker.helpers.arrayElements(days, faker.number.int({ min: 5, max: 7 }))

  return businessDays.map(day => ({
    dayOfWeek: day,
    startTime: generateRandomTime(7, 10),
    endTime: generateRandomTime(17, 22)
  }))
}

/**
 * Generates a random discount value based on type
 * @param type - 'PERCENTAGE' or 'FIXED'
 * @returns Appropriate discount value
 */
export function generateDiscountValue(type: 'PERCENTAGE' | 'FIXED'): number {
  if (type === 'PERCENTAGE') {
    // Percentage discounts: 5%, 10%, 15%, 20%, 25%, 30%, 40%, 50%
    return faker.helpers.arrayElement([5, 10, 15, 20, 25, 30, 40, 50])
  } else {
    // Fixed discounts in thousands: 5K, 10K, 20K, 50K, 100K
    return faker.helpers.arrayElement([5000, 10000, 20000, 50000, 100000])
  }
}