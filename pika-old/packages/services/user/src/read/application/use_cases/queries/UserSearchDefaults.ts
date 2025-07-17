import { UserSearchQuery } from './UserSearchQuery.js'

/**
 * Helper functions to create common user search queries
 * Used by handlers to generate predefined search parameters for common use cases
 */
export class UserSearchDefaults {
  /**
   * Creates default search parameters
   */
  public static createDefault(): UserSearchQuery {
    return {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
  }

  /**
   * Creates search parameters for active users
   */
  public static forActiveUsers(): UserSearchQuery {
    return {
      ...this.createDefault(),
      status: 'ACTIVE',
    }
  }

  /**
   * Creates search parameters for customers
   */
  public static forCustomers(): UserSearchQuery {
    return {
      ...this.createDefault(),
      role: 'CUSTOMER',
      status: 'ACTIVE',
      includeCustomerProfile: true,
    }
  }

  /**
   * Creates search parameters for service providers
   */
  public static forProviders(): UserSearchQuery {
    return {
      ...this.createDefault(),
      role: 'PROVIDER',
      status: 'ACTIVE',
      includeProviderProfile: true,
    }
  }

  /**
   * Creates search parameters for recently active users
   */
  public static forRecentlyActive(daysAgo = 30): UserSearchQuery {
    const date = new Date()

    date.setDate(date.getDate() - daysAgo)

    return {
      ...this.createDefault(),
      sortBy: 'lastLoginAt',
      status: 'ACTIVE',
      lastLoginAtStart: date,
    }
  }

  /**
   * Creates search parameters for recently created users
   */
  public static forRecentlyCreated(daysAgo = 30): UserSearchQuery {
    const date = new Date()

    date.setDate(date.getDate() - daysAgo)

    return {
      ...this.createDefault(),
      createdAtStart: date,
    }
  }
}
