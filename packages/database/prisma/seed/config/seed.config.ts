/**
 * Comprehensive seed configuration for all entities
 */

export interface SeedConfig {
  // User related
  adminCount: number
  memberCount: number
  professionalCount: number
  therapistCount: number
  contentCreatorCount: number

  // Gym related
  gymCount: number
  gymReviewsPerGym: number
  gymMembersPerGym: number
  gymTrainersPerGym: number

  // Session related
  sessionsPerProfessional: number // Deprecated - not used anymore
  minSessionsPerUser: number
  maxSessionsPerUser: number
  sessionReviewsPercentage: number

  // Support related
  problemsPerUser: number
  commentsPerProblem: number

  // Social related
  followsPerUser: number
  friendsPerUser: number
  activitiesPerUser: number
  interactionsPerActivity: number

  // Payment related
  creditPacksCount: number
  promoCodesCount: number
  subscriptionPlansCount: number

  // Other
  templatesPerProfessional: number
  notificationsPerUser: number
}

export const DEFAULT_SEED_CONFIG: SeedConfig = {
  // User related
  adminCount: 3,
  memberCount: 50,
  professionalCount: 20,
  therapistCount: 10,
  contentCreatorCount: 15,

  // Gym related
  gymCount: 15,
  gymReviewsPerGym: 10,
  gymMembersPerGym: 30,
  gymTrainersPerGym: 5,

  // Session related
  sessionsPerProfessional: 50, // Deprecated - not used anymore
  minSessionsPerUser: 20,
  maxSessionsPerUser: 200,
  sessionReviewsPercentage: 75,

  // Support related
  problemsPerUser: 3,
  commentsPerProblem: 5,

  // Social related
  followsPerUser: 15,
  friendsPerUser: 10,
  activitiesPerUser: 20,
  interactionsPerActivity: 5,

  // Payment related
  creditPacksCount: 5,
  promoCodesCount: 10,
  subscriptionPlansCount: 3,

  // Other
  templatesPerProfessional: 5,
  notificationsPerUser: 10,
}

export function getSeedConfig(): SeedConfig {
  return {
    ...DEFAULT_SEED_CONFIG,
    // Override with environment variables if needed
    adminCount: Number(process.env.SEED_ADMIN_COUNT) || DEFAULT_SEED_CONFIG.adminCount,
    memberCount: Number(process.env.SEED_MEMBER_COUNT) || DEFAULT_SEED_CONFIG.memberCount,
    professionalCount: Number(process.env.SEED_PROFESSIONAL_COUNT) || DEFAULT_SEED_CONFIG.professionalCount,
    gymCount: Number(process.env.SEED_GYM_COUNT) || DEFAULT_SEED_CONFIG.gymCount,
  }
}