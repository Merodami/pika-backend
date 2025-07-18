/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User statistics for admin view
 */
export type UserStatsResponse = {
  userId: string
  period: {
    /**
     * ISO 8601 datetime with timezone
     */
    start: string
    /**
     * ISO 8601 datetime with timezone
     */
    end: string
  }
  totalBookings: number
  totalSpent: number
  creditsBalance: number
  friendsCount: number
  followersCount: number
  reportsCount: number
  activityScore: number
  /**
   * ISO 8601 datetime with timezone
   */
  lastActiveDate?: string
}
