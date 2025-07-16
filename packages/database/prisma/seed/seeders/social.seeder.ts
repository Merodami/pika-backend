/**
 * Social seeder - Creates follows, friends, activities, and interactions
 */

import { faker } from '@faker-js/faker'
import { Gym,PrismaClient, Session, User } from '@prisma/client'
import {InteractionType } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import {
  generateActivityData,
  generateCommentContent,
  generateFollowData,
  generateFriendData,
  generateInteractionData,
  generateNotificationData
} from '../data/social.data.js'
import { logger } from '../utils/logger.js'

export async function seedSocial(
  prisma: PrismaClient,
  users: User[],
  sessions: Session[],
  gyms: Gym[]
): Promise<void> {
  const config = getSeedConfig()

  // Create follows
  logger.info('Creating follow relationships...')

  for (const user of users) {
    const followCount = Math.min(config.followsPerUser, users.length - 1)
    const toFollow = faker.helpers.arrayElements(
      users.filter(u => u.id !== user.id),
      followCount
    )

    for (const targetUser of toFollow) {
      try {
        await prisma.follow.create({
          data: generateFollowData(user.id, targetUser.id),
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  // Create friend relationships
  logger.info('Creating friend relationships...')

  for (const user of users) {
    const friendCount = Math.min(config.friendsPerUser, users.length - 1)
    const potentialFriends = faker.helpers.arrayElements(
      users.filter(u => u.id !== user.id),
      friendCount
    )

    for (const friend of potentialFriends) {
      try {
        // Check if relationship already exists (by email)
        const existing = await prisma.friend.findFirst({
          where: {
            userId: user.id,
            email: friend.email,
          },
        })

        if (!existing) {
          await prisma.friend.create({
            data: generateFriendData(user.id, friend.email),
          })
        }
      } catch {
        // Skip errors
      }
    }
  }

  // Create activities
  logger.info('Creating user activities...')

  const activities = []

  for (const user of users) {
    for (let i = 0; i < config.activitiesPerUser; i++) {
      try {
        const relatedData: any = {
          sessionId: faker.helpers.arrayElement(sessions).id,
          targetUserId: faker.helpers.arrayElement(users.filter(u => u.id !== user.id)).id,
          gymId: faker.helpers.arrayElement(gyms).id,
          sessionTitle: faker.helpers.arrayElement(['HIIT Workout', 'Yoga Flow', 'Strength Training']),
          sessionDate: faker.date.future(),
          professionalName: faker.person.fullName(),
          duration: faker.number.int({ min: 30, max: 90 }),
        }

        const activityData = generateActivityData(user.id, relatedData)
        const activity = await prisma.activity.create({
          data: activityData,
        })

        activities.push(activity)
      } catch {
        // Skip errors
      }
    }
  }

  // Create interactions on activities
  logger.info('Creating social interactions...')

  for (const activity of activities) {
    const interactionCount = faker.number.int({ min: 0, max: config.interactionsPerActivity })
    const interactors = faker.helpers.arrayElements(users, interactionCount)

    for (const user of interactors) {
      try {
        const interactionData = generateInteractionData(user.id, 'activity', activity.id)
        const interaction = await prisma.socialInteraction.create({
          data: interactionData,
        })

        // Add comment content if it's a comment
        if (interaction.type === InteractionType.COMMENT) {
          const comment = generateCommentContent(InteractionType.COMMENT)

          await prisma.socialInteraction.update({
            where: { id: interaction.id },
            data: { comment },
          })
        }
      } catch {
        // Skip duplicates
      }
    }
  }

  // Create notifications
  logger.info('Creating notifications...')

  for (const user of users) {
    for (let i = 0; i < config.notificationsPerUser; i++) {
      try {
        const relatedData = {
          sessionId: faker.helpers.arrayElement(sessions).id,
          sessionTitle: faker.helpers.arrayElement(['Morning Yoga', 'HIIT Class', 'Strength Training']),
          sessionDate: faker.date.future().toLocaleDateString(),
          startTime: faker.date.future(),
          userName: faker.person.fullName(),
          userId: faker.helpers.arrayElement(users.filter(u => u.id !== user.id)).id,
          reviewId: faker.string.uuid(),
          rating: faker.number.int({ min: 3, max: 5 }),
          amount: faker.number.int({ min: 20, max: 200 }),
          currency: 'USD',
          paymentMethod: faker.helpers.arrayElement(['card', 'paypal', 'credits']),
        }

        await prisma.notification.create({
          data: generateNotificationData(user.id, relatedData),
        })
      } catch {
        // Skip errors
      }
    }
  }

  logger.success('✅ Created social data')
}