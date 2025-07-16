/**
 * Gym seeder - Creates gyms with equipment, amenities, and reviews
 */

import { faker } from '@faker-js/faker'
import { Gym,PrismaClient } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import {
  generateGymData,
  generateGymReview,
  GYM_AMENITIES,
  GYM_EQUIPMENT,
  GYM_FEATURES
} from '../data/gym.data.js'
import { logger } from '../utils/logger.js'

export interface GymSeederResult {
  gyms: Gym[]
}

export async function seedGyms(
  prisma: PrismaClient,
  users: any[]
): Promise<GymSeederResult> {
  const config = getSeedConfig()
  const gyms: Gym[] = []

  logger.info(`Creating ${config.gymCount} gyms...`)

  for (let i = 0; i < config.gymCount; i++) {
    try {
      const gymData = generateGymData(i)

      // Create gym
      const gym = await prisma.gym.create({
        data: gymData,
      })

      gyms.push(gym)

      // Add equipment
      const equipmentCount = faker.number.int({ min: 8, max: 15 })
      const selectedEquipment = faker.helpers.arrayElements(GYM_EQUIPMENT, equipmentCount)

      for (const equipment of selectedEquipment) {
        await prisma.stuff.create({
          data: {
            gymId: gym.id,
            name: equipment.name,
            icon: equipment.icon,
            type: equipment.type,
            isActive: faker.datatype.boolean(0.95),
          },
        })
      }

      // Add amenities
      const amenityCount = faker.number.int({ min: 5, max: 10 })
      const selectedAmenities = faker.helpers.arrayElements(GYM_AMENITIES, amenityCount)

      for (const amenity of selectedAmenities) {
        await prisma.stuff.create({
          data: {
            gymId: gym.id,
            name: amenity.name,
            icon: amenity.icon,
            type: amenity.type,
            isActive: faker.datatype.boolean(0.9),
          },
        })
      }

      // Add features
      const featureCount = faker.number.int({ min: 3, max: 8 })
      const selectedFeatures = faker.helpers.arrayElements(GYM_FEATURES, featureCount)

      for (const feature of selectedFeatures) {
        await prisma.stuff.create({
          data: {
            gymId: gym.id,
            name: feature.name,
            icon: feature.icon,
            type: feature.type,
            isActive: faker.datatype.boolean(0.95),
          },
        })
      }

      // Add hourly prices (using WeekDay enum)
      const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

      for (const dayOfWeek of weekdays) {
        for (let hour = 6; hour < 22; hour++) {
          const basePrice = faker.number.int({ min: 10, max: 30 })

          let price = basePrice

          // Peak hours pricing
          if (hour >= 17 && hour <= 20) {
            price = Math.round(basePrice * 1.2)
          } else if (hour < 9) {
            price = Math.round(basePrice * 0.8)
          }

          await prisma.gymHourlyPrice.create({
            data: {
              gymId: gym.id,
              dayOfWeek: dayOfWeek as any,
              hour,
              price,
            },
          })
        }
      }

      // Add weekend prices
      for (const dayOfWeek of ['SATURDAY', 'SUNDAY']) {
        for (let hour = 8; hour < 20; hour++) {
          await prisma.gymHourlyPrice.create({
            data: {
              gymId: gym.id,
              dayOfWeek: dayOfWeek as any,
              hour,
              price: faker.number.int({ min: 15, max: 35 }),
            },
          })
        }
      }

      // Add special prices for holidays/events
      const specialDates = faker.number.int({ min: 0, max: 3 })

      for (let j = 0; j < specialDates; j++) {
        await prisma.gymSpecialPrice.create({
          data: {
            gymId: gym.id,
            date: faker.date.future({ years: 0.5 }),
            hour: faker.number.int({ min: 8, max: 20 }),
            price: faker.number.int({ min: 20, max: 50 }),
            reason: faker.helpers.arrayElement([
              'Holiday Special',
              'New Year Promotion',
              'Summer Discount',
              'Anniversary Sale',
            ]),
          },
        })
      }

      // Add gym members
      const memberCount = Math.min(config.gymMembersPerGym, users.length)
      const gymMembers = faker.helpers.arrayElements(users, memberCount)

      for (const member of gymMembers) {
        try {
          await prisma.gymMember.create({
            data: {
              gymId: gym.id,
              userId: member.id,
              status: faker.helpers.weightedArrayElement([
                { weight: 80, value: 'ACTIVE' },
                { weight: 15, value: 'INACTIVE' },
                { weight: 5, value: 'SUSPENDED' },
              ]),
            },
          })
        } catch {
          // Skip if duplicate
        }
      }

      // Add gym trainers (from professionals and therapists)
      const trainers = users.filter(u =>
        ['PROFESSIONAL', 'THERAPIST'].includes(u.role)
      )
      const trainerCount = Math.min(config.gymTrainersPerGym, trainers.length)
      const gymTrainers = faker.helpers.arrayElements(trainers, trainerCount)

      for (const trainer of gymTrainers) {
        try {
          await prisma.gymTrainer.create({
            data: {
              gymId: gym.id,
              userId: trainer.id,
              status: faker.helpers.weightedArrayElement([
                { weight: 90, value: 'ACTIVE' },
                { weight: 8, value: 'INACTIVE' },
                { weight: 2, value: 'SUSPENDED' },
              ]),
              startDate: faker.date.recent({ days: 365 }),
              endDate: faker.datatype.boolean(0.1)
                ? faker.date.future({ years: 0.5 })
                : null,
            },
          })
        } catch {
          // Skip if duplicate
        }
      }

      // Add gym reviews
      const reviewCount = config.gymReviewsPerGym
      const reviewers = faker.helpers.arrayElements(users, reviewCount)

      for (const reviewer of reviewers) {
        try {
          const reviewData = generateGymReview()

          await prisma.gymReview.create({
            data: {
              gymId: gym.id,
              userId: reviewer.id,
              ...reviewData,
            },
          })
        } catch {
          // Skip if duplicate
        }
      }

      logger.debug(`Created gym: ${gym.name}`)
    } catch (error) {
      logger.error(`Failed to create gym:`, error)
    }
  }

  logger.success(`✅ Created ${gyms.length} gyms`)

  return { gyms }
}