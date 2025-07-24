/**
 * Subscription service types
 *
 * Organization follows DDD principles:
 * - Domain types: Business logic and domain concepts
 * - Repository types: Data layer contracts
 * - Search types: Query and filter parameters
 */

// Re-export all types
export * from './domain.js'
export * from './repository.js'
export * from './search.js'
export * from './constants.js'
export * from './enums.js'
export * from './interfaces.js'

// Re-export domain types from SDK
export type {
  CreateSubscriptionDTO,
  CreateSubscriptionPlanDTO,
  CreditsDomain,
  CreditsDTO,
  SubscriptionDomain,
  SubscriptionDTO,
  SubscriptionPlanDomain,
  SubscriptionPlanDTO,
  SubscriptionWithPlanDomain,
  SubscriptionWithPlanDTO,
  UpdateSubscriptionDTO,
  UpdateSubscriptionPlanDTO,
} from '@pika/sdk'

// Re-export shared types
export type {
  PaginatedResult,
  ServiceContext,
  UserRole,
  UserRoleType,
} from '@pika/types'
