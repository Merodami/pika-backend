/**
 * Database utilities for seed operations
 */

import { PrismaClient } from '@prisma/client'

import { logger } from './logger.js'

/**
 * Clear all data from database tables in the correct order to avoid foreign key constraints
 * @param prisma - Prisma client instance
 */
export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  try {
    logger.info('Clearing database tables...')

    // Delete in reverse dependency order to avoid foreign key constraints

    // 1. Delete social interaction data first
    await prisma.socialInteraction.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.notification.deleteMany()

    // 2. Delete session related data
    await prisma.sessionRecord.deleteMany()
    await prisma.sessionReview.deleteMany()
    await prisma.waitingList.deleteMany()
    await prisma.invitation.deleteMany()
    await prisma.sessionInvitee.deleteMany()
    await prisma.session.deleteMany()

    // 3. Delete support data
    await prisma.supportComment.deleteMany()
    await prisma.problem.deleteMany()

    // 4. Delete payment related data
    await prisma.creditsHistory.deleteMany()
    await prisma.credits.deleteMany()
    await prisma.promoCodeUsage.deleteMany()
    await prisma.promoCode.deleteMany()
    await prisma.membership.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.creditsPack.deleteMany()
    await prisma.subscriptionPlan.deleteMany()

    // 5. Delete gym related data
    await prisma.gymReview.deleteMany()
    await prisma.gymTrainer.deleteMany()
    await prisma.gymMember.deleteMany()
    await prisma.induction.deleteMany()
    await prisma.stuff.deleteMany()
    await prisma.gymSpecialPrice.deleteMany()
    await prisma.gymHourlyPrice.deleteMany()
    await prisma.gym.deleteMany()

    // 6. Delete template data
    await prisma.template.deleteMany()

    // 7. Delete professional data
    await prisma.professional.deleteMany()

    // 8. Delete social connections
    await prisma.friend.deleteMany()
    await prisma.follow.deleteMany()

    // 9. Delete user health data
    await prisma.parQ.deleteMany()

    // 10. Delete communication/storage logs
    await prisma.communicationLog.deleteMany()
    await prisma.fileStorageLog.deleteMany()

    // 11. Delete address data
    await prisma.address.deleteMany()

    // 12. Delete auth related data
    await prisma.userIdentity.deleteMany()
    await prisma.userAuthMethod.deleteMany()
    await prisma.userDevice.deleteMany()
    await prisma.userMfaSettings.deleteMany()
    await prisma.securityEvent.deleteMany()

    // 13. Delete audit logs
    await prisma.auditLog.deleteMany()

    // 14. Finally delete users
    await prisma.user.deleteMany()

    logger.success('✅ Database cleared successfully')
  } catch (error) {
    logger.error('Failed to clear database:', error)
    throw error
  }
}

/**
 * Database statistics interface
 */
interface DatabaseStats {
  users: number
  gyms: number
  sessions: number
  problems: number
  subscriptions: number
  activities: number
}

/**
 * Get counts for main tables to check seeding results
 * @param prisma - Prisma client instance
 */
export async function getDatabaseStats(prisma: PrismaClient): Promise<DatabaseStats> {
  const stats = {
    users: await prisma.user.count(),
    gyms: await prisma.gym.count(),
    sessions: await prisma.session.count(),
    problems: await prisma.problem.count(),
    subscriptions: await prisma.subscription.count(),
    activities: await prisma.activity.count(),
  }

  return stats
}