import type {
  BookingStatsSummaryDomain,
  UserBookingStatsDomain,
} from '../domain/bookingStats.js'
import type { UserBookingStatsDTO } from '../dto/bookingStats.dto.js'

/**
 * Mapper for booking statistics data transformations
 */
export class BookingStatsMapper {
  /**
   * Convert domain to DTO
   */
  static toDTO(domain: UserBookingStatsDomain): UserBookingStatsDTO {
    return {
      ...domain,
      lastBookingDate: domain.lastBookingDate?.toISOString(),
    }
  }

  /**
   * Convert DTO to domain
   */
  static fromDTO(dto: UserBookingStatsDTO): UserBookingStatsDomain {
    return {
      ...dto,
      lastBookingDate: dto.lastBookingDate
        ? new Date(dto.lastBookingDate)
        : undefined,
    }
  }

  /**
   * Format booking stats for display
   */
  static formatStats(stats: UserBookingStatsDomain): UserBookingStatsDomain {
    return {
      ...stats,
      // Ensure numbers are properly formatted
      totalSpent: Math.round(stats.totalSpent * 100) / 100,
    }
  }

  /**
   * Calculate booking completion rate
   */
  static getCompletionRate(stats: UserBookingStatsDomain): number {
    if (stats.totalBookings === 0) return 0

    return (stats.completedBookings / stats.totalBookings) * 100
  }

  /**
   * Calculate cancellation rate
   */
  static getCancellationRate(stats: UserBookingStatsDomain): number {
    if (stats.totalBookings === 0) return 0

    return (stats.cancelledBookings / stats.totalBookings) * 100
  }

  /**
   * Calculate declined rate
   */
  static getDeclinedRate(stats: UserBookingStatsDomain): number {
    if (stats.totalBookings === 0) return 0

    return (stats.declinedBookings / stats.totalBookings) * 100
  }

  /**
   * Get booking status summary
   */
  static getStatusSummary(
    stats: UserBookingStatsDomain,
  ): BookingStatsSummaryDomain {
    return {
      completionRate: this.getCompletionRate(stats),
      cancellationRate: this.getCancellationRate(stats),
      declinedRate: this.getDeclinedRate(stats),
      averageSpent:
        stats.totalBookings > 0 ? stats.totalSpent / stats.totalBookings : 0,
    }
  }
}
