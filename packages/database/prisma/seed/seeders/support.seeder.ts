/**
 * Support seeder - Creates support problems and comments
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, User } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import { generateProblemData, generateSupportCommentData } from '../data/support.data.js'
import { logger } from '../utils/logger.js'

export async function seedSupport(
  prisma: PrismaClient,
  users: User[]
): Promise<void> {
  const config = getSeedConfig()

  logger.info('Creating support problems and comments...')

  // Get support agents (admins)
  const supportAgents = users.filter(u => u.role === 'ADMIN')
  const regularUsers = users.filter(u => u.role !== 'ADMIN')

  // Create problems for some users
  const usersWithProblems = faker.helpers.arrayElements(
    regularUsers,
    Math.floor(regularUsers.length * 0.4) // 40% of users have problems
  )

  let globalTicketCounter = 1

  for (const user of usersWithProblems) {
    const problemCount = faker.number.int({ min: 1, max: config.problemsPerUser })

    for (let i = 0; i < problemCount; i++) {
      try {
        const problemData = generateProblemData(user.id, globalTicketCounter++, supportAgents)
        const problem = await prisma.problem.create({
          data: problemData,
        })

        // problemData.assignedTo is already set to a real user ID if needed

        // Create comments thread
        const commentCount = faker.number.int({ min: 1, max: config.commentsPerProblem })

        let lastCommenter = user.id

        for (let j = 0; j < commentCount; j++) {
          try {
            // Alternate between user and support agent
            const isSupport = j % 2 === 1
            const commenterId = isSupport && supportAgents.length > 0
              ? faker.helpers.arrayElement(supportAgents).id
              : user.id

            if (isSupport && commenterId === lastCommenter) {
              continue // Skip to avoid same person commenting twice
            }

            const commentData = generateSupportCommentData(
              problem.id,
              commenterId,
              isSupport,
              j
            )

            await prisma.supportComment.create({
              data: commentData,
            })

            lastCommenter = commenterId
          } catch (error) {
            logger.error('Failed to create support comment:', error)
          }
        }
      } catch (error) {
        logger.error('Failed to create problem:', error)
      }
    }
  }

  logger.success('✅ Created support data')
}