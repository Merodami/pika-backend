/**
 * Session seeder - Creates sessions, bookings, and reviews
 */

import { faker } from '@faker-js/faker'
import { Gym,PrismaClient, Session, User } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import {
  generateSessionData,
  generateSessionInvitee,
  generateSessionRecord,
  generateSessionReview} from '../data/session.data.js'
import { logger } from '../utils/logger.js'

export interface SessionSeederResult {
  sessions: Session[]
}

export async function seedSessions(
  prisma: PrismaClient,
  professionals: User[],
  users: User[],
  gyms: Gym[]
): Promise<SessionSeederResult> {
  const config = getSeedConfig()
  const sessions: Session[] = []

  logger.info(`Creating sessions for ${professionals.length} professionals...`)

  // First, we need to create Friend relationships for invitations
  logger.info('Creating friend relationships for session invitations...')

  const friendRelationships: Map<string, string[]> = new Map()

  for (const professional of professionals) {
    const friendCount = faker.number.int({ min: 5, max: 15 })
    const friends = faker.helpers.arrayElements(
      users.filter(u => u.id !== professional.id),
      Math.min(friendCount, users.length - 1)
    )

    const friendIds: string[] = []

    for (const friend of friends) {
      try {
        const friendRelation = await prisma.friend.create({
          data: {
            userId: professional.id,
            email: friend.email,
            name: `${friend.firstName} ${friend.lastName}`,
            avatarUrl: friend.avatarUrl,
            status: 'ACCEPTED',
            type: faker.helpers.arrayElement(['FRIEND', 'CLIENT']),
            referredUserId: friend.id,
          },
        })

        friendIds.push(friendRelation.id)
      } catch {
        // Skip duplicates
      }
    }

    friendRelationships.set(professional.id, friendIds)
  }

  // First, ensure each user has a base of 20 sessions minimum
  logger.info('Creating base sessions for all users (20 minimum per user)...')

  for (const user of users) {
    // Each user gets between minSessionsPerUser and maxSessionsPerUser sessions
    const userSessionCount = faker.number.int({
      min: config.minSessionsPerUser || 20,
      max: config.maxSessionsPerUser || 200
    })

    for (let i = 0; i < userSessionCount; i++) {
      try {
        const gym = faker.helpers.arrayElement(gyms)
        const professional = faker.helpers.arrayElement(professionals)

        const sessionData = generateSessionData(
          user.id,
          gym.id,
          professional.id,
          gym.name,
          `${professional.firstName} ${professional.lastName}`
        )

        const session = await prisma.session.create({
          data: sessionData,
        })

        sessions.push(session)

        // Create session records
        await prisma.sessionRecord.create({
          data: generateSessionRecord(session.id, user.id),
        })

        // Create invitations for upcoming sessions
        const userFriendIds = friendRelationships.get(user.id) || []

        if (sessionData.status === 'UPCOMING' && userFriendIds.length > 0) {
          const inviteeCount = faker.number.int({ min: 1, max: Math.min(5, userFriendIds.length) })
          const inviteeFriendIds = faker.helpers.arrayElements(userFriendIds, inviteeCount)

          for (const friendId of inviteeFriendIds) {
            try {
              const inviteeData = generateSessionInvitee(session.id, friendId, sessionData.status)

              await prisma.sessionInvitee.create({
                data: inviteeData,
              })
            } catch {
              // Skip duplicate invitations
            }
          }
        }

        // Create reviews for completed sessions
        if (sessionData.status === 'COMPLETED') {
          const reviewerCount = faker.number.int({ min: 1, max: 5 })
          const reviewers = faker.helpers.arrayElements(users, reviewerCount)

          for (const reviewer of reviewers) {
            try {
              // Create review
              if (faker.number.int({ min: 1, max: 100 }) <= config.sessionReviewsPercentage) {
                const reviewData = generateSessionReview(session.id, reviewer.id)

                await prisma.sessionReview.create({
                  data: reviewData,
                })
              }

              // Create session completion record
              await prisma.sessionRecord.create({
                data: {
                  sessionId: session.id,
                  type: 'completed',
                  description: 'Session completed successfully',
                  modifiedBy: professional.id,
                },
              })
            } catch {
              // Skip duplicates
            }
          }
        }
      } catch (error) {
        logger.error('Failed to create session:', error)
      }
    }
  }

  // Create waiting lists for some popular sessions
  logger.info('Creating waiting lists for popular sessions...')

  const upcomingSessions = sessions
    .filter(s => s.status === 'UPCOMING')
    .slice(0, 20)

  for (const session of upcomingSessions) {
    const waitlistCount = faker.number.int({ min: 1, max: 5 })
    const waitlistUsers = faker.helpers.arrayElements(users, waitlistCount)

    for (const user of waitlistUsers) {
      try {
        await prisma.waitingList.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            status: faker.helpers.arrayElement(['WAITING', 'ACCEPTED', 'DECLINED']),
            joinedAt: faker.date.recent({ days: 7 }),
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  logger.success(`✅ Created ${sessions.length} sessions`)

  // Calculate and log session distribution
  const sessionCounts = new Map<string, number>()

  sessions.forEach(session => {
    sessionCounts.set(session.userId, (sessionCounts.get(session.userId) || 0) + 1)
  })

  const counts = Array.from(sessionCounts.values())
  const minSessions = Math.min(...counts)
  const maxSessions = Math.max(...counts)
  const avgSessions = sessions.length / users.length

  logger.info(`📊 Session distribution: Min: ${minSessions}, Max: ${maxSessions}, Avg: ${avgSessions.toFixed(1)} sessions per user`)

  return { sessions }
}