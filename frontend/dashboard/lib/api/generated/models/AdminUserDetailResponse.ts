/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Detailed user information for admin
 */
export type AdminUserDetailResponse = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  avatarUrl?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED'
  role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
  flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
  /**
   * ISO 8601 datetime with timezone
   */
  verificationDate?: string
  /**
   * ISO 8601 datetime with timezone
   */
  lastLoginAt?: string
  /**
   * ISO 8601 datetime with timezone
   */
  lastActivityAt?: string
  loginCount?: number
  ipAddress?: string
  userAgent?: string
  stats: {
    totalBookings: number
    totalSpent: number
    creditsBalance: number
    friendsCount: number
    followersCount: number
    reportsCount: number
  }
  adminNotes?: string
  suspensionReason?: string
  /**
   * ISO 8601 datetime with timezone
   */
  suspendedAt?: string
  suspendedBy?: string
  description?: string
  specialties?: Array<string>
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}
