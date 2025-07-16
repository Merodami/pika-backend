/**
 * User seeder - Creates users with different roles
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, User, UserRole } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import { generateParQData,generateProfessionalData, generateUserData } from '../data/user.data.js'
import { logger } from '../utils/logger.js'

export interface UserSeederResult {
  users: User[]
  adminUsers: User[]
  memberUsers: User[]
  professionalUsers: User[]
  therapistUsers: User[]
  contentCreatorUsers: User[]
}

export async function seedUsers(prisma: PrismaClient): Promise<UserSeederResult> {
  const config = getSeedConfig()
  const result: UserSeederResult = {
    users: [],
    adminUsers: [],
    memberUsers: [],
    professionalUsers: [],
    therapistUsers: [],
    contentCreatorUsers: [],
  }

  // Create admins
  logger.info(`Creating ${config.adminCount} admin users...`)

  for (let i = 0; i < config.adminCount; i++) {
    try {
      const userData = await generateUserData(UserRole.ADMIN, i)
      const user = await prisma.user.create({ data: userData })

      result.users.push(user)
      result.adminUsers.push(user)
    } catch (error) {
      logger.error('Failed to create admin user:', error)
    }
  }

  // Create members
  logger.info(`Creating ${config.memberCount} member users...`)

  for (let i = 0; i < config.memberCount; i++) {
    try {
      const userData = await generateUserData(UserRole.MEMBER, i)
      const user = await prisma.user.create({ data: userData })

      result.users.push(user)
      result.memberUsers.push(user)

      // Create ParQ for some members
      if (faker.datatype.boolean(0.7)) {
        await prisma.parQ.create({
          data: generateParQData(user.id),
        })
      }
    } catch (error) {
      logger.error('Failed to create member user:', error)
    }
  }

  // Create professionals
  logger.info(`Creating ${config.professionalCount} professional users...`)

  for (let i = 0; i < config.professionalCount; i++) {
    try {
      const userData = await generateUserData(UserRole.PROFESSIONAL, i)
      const user = await prisma.user.create({ data: userData })

      result.users.push(user)
      result.professionalUsers.push(user)

      // Create professional profile
      await prisma.professional.create({
        data: generateProfessionalData(user.id),
      })
    } catch (error) {
      logger.error('Failed to create professional user:', error)
    }
  }

  // Create therapists
  logger.info(`Creating ${config.therapistCount} therapist users...`)

  for (let i = 0; i < config.therapistCount; i++) {
    try {
      const userData = await generateUserData(UserRole.THERAPIST, i)
      const user = await prisma.user.create({ data: userData })

      result.users.push(user)
      result.therapistUsers.push(user)

      // Create professional profile for therapists too
      const professionalData = generateProfessionalData(user.id)

      professionalData.specialties = ['Massage Therapy', 'Physical Therapy', 'Sports Recovery']
      await prisma.professional.create({ data: professionalData })
    } catch (error) {
      logger.error('Failed to create therapist user:', error)
    }
  }

  // Create content creators
  logger.info(`Creating ${config.contentCreatorCount} content creator users...`)

  for (let i = 0; i < config.contentCreatorCount; i++) {
    try {
      const userData = await generateUserData(UserRole.CONTENT_CREATOR, i)
      const user = await prisma.user.create({ data: userData })

      result.users.push(user)
      result.contentCreatorUsers.push(user)
    } catch (error) {
      logger.error('Failed to create content creator user:', error)
    }
  }

  // Create user addresses for some users
  logger.info('Creating user addresses...')

  const usersWithAddresses = faker.helpers.arrayElements(result.users,
    Math.floor(result.users.length * 0.6)
  )

  for (const user of usersWithAddresses) {
    try {
      await prisma.address.create({
        data: {
          userId: user.id,
          addressLine1: faker.location.streetAddress(),
          addressLine2: faker.datatype.boolean(0.3) ? faker.location.secondaryAddress() : null,
          city: faker.location.city(),
          state: faker.location.state(),
          postalCode: faker.location.zipCode(),
          country: faker.location.country(),
          isDefault: true,
        },
      })
    } catch (error) {
      logger.error('Failed to create address:', error)
    }
  }

  logger.success(`✅ Created ${result.users.length} users`)

  return result
}