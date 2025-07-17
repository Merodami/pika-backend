import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { GeoPoint } from '@pika/types-core'

export interface RedemptionAttempt {
  redemptionId?: string // Optional - only available after redemption is saved
  voucherId: string
  customerId: string
  providerId: string
  location?: GeoPoint
  timestamp: Date
}

export interface FraudCheckResult {
  allowed: boolean
  flags: FraudFlag[]
  riskScore: number
  requiresReview: boolean
}

export interface FraudFlag {
  type:
    | 'VELOCITY'
    | 'LOCATION_ANOMALY'
    | 'RAPID_REDEMPTION'
    | 'DISTANT_LOCATION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  details?: Record<string, any>
}

/**
 * MVP Fraud Detection Service
 * Soft validation approach - flags suspicious activity but doesn't block
 */
export class FraudDetectionService {
  // Configurable thresholds
  private readonly RAPID_REDEMPTION_MINUTES = 5 // Flag if multiple redemptions within 5 minutes
  private readonly VELOCITY_WARNING_KM_PER_HOUR = 60 // Reasonable travel speed
  private readonly LOCATION_ANOMALY_KM = 30 // Distance from usual locations
  private readonly FRAUD_LOG_TTL = 86400 * 30 // 30 days

  constructor(private readonly cacheService: ICacheService) {}

  /**
   * Check redemption attempt for fraud indicators
   * MVP: Always allows redemption but flags suspicious patterns
   */
  async checkRedemption(attempt: RedemptionAttempt): Promise<FraudCheckResult> {
    const flags: FraudFlag[] = []

    // Run all checks in parallel
    const [rapidCheck, velocityCheck, locationCheck] = await Promise.all([
      this.checkRapidRedemption(attempt),
      this.checkVelocity(attempt),
      this.checkLocationAnomaly(attempt),
    ])

    // Collect flags
    if (rapidCheck) flags.push(rapidCheck)
    if (velocityCheck) flags.push(velocityCheck)
    if (locationCheck) flags.push(locationCheck)

    // Calculate risk score based on flags
    const riskScore = this.calculateRiskScore(flags)

    // Determine if manual review is needed
    const requiresReview =
      flags.some((flag) => flag.severity === 'HIGH') || riskScore > 70

    // Log suspicious activity
    if (flags.length > 0) {
      await this.logSuspiciousActivity(attempt, flags, riskScore)
    }

    // MVP: Always allow redemption
    return {
      allowed: true,
      flags,
      riskScore,
      requiresReview,
    }
  }

  /**
   * Check for rapid consecutive redemptions
   */
  private async checkRapidRedemption(
    attempt: RedemptionAttempt,
  ): Promise<FraudFlag | null> {
    const key = `fraud:last_redemption:${attempt.customerId}`

    try {
      const lastRedemption = await this.cacheService.get<{
        timestamp: string
        voucherId: string
      }>(key)

      // Store current redemption for next check
      await this.cacheService.set(
        key,
        {
          timestamp: attempt.timestamp.toISOString(),
          voucherId: attempt.voucherId,
        },
        3600,
      ) // 1 hour TTL

      if (!lastRedemption) {
        return null // First redemption
      }

      const timeDiffMinutes =
        (attempt.timestamp.getTime() -
          new Date(lastRedemption.timestamp).getTime()) /
        1000 /
        60

      if (timeDiffMinutes < this.RAPID_REDEMPTION_MINUTES) {
        return {
          type: 'RAPID_REDEMPTION',
          severity: timeDiffMinutes < 1 ? 'HIGH' : 'MEDIUM',
          message: `Multiple redemptions within ${Math.round(timeDiffMinutes)} minutes`,
          details: {
            previousVoucherId: lastRedemption.voucherId,
            minutesApart: Math.round(timeDiffMinutes),
          },
        }
      }

      return null
    } catch (error) {
      logger.error('Error checking rapid redemption', { error, attempt })

      return null
    }
  }

  /**
   * Check travel velocity between redemptions
   */
  private async checkVelocity(
    attempt: RedemptionAttempt,
  ): Promise<FraudFlag | null> {
    if (!attempt.location) {
      return null // Can't check without location
    }

    const key = `fraud:location_history:${attempt.customerId}`

    try {
      const lastLocation = await this.cacheService.get<{
        location: GeoPoint
        timestamp: string
        providerId: string
      }>(key)

      // Store current location
      await this.cacheService.set(
        key,
        {
          location: attempt.location,
          timestamp: attempt.timestamp.toISOString(),
          providerId: attempt.providerId,
        },
        86400,
      ) // 24 hour TTL

      if (!lastLocation || !lastLocation.location) {
        return null // First location
      }

      // Don't check velocity for same provider (multi-location support)
      if (lastLocation.providerId === attempt.providerId) {
        return null
      }

      const distance = this.calculateDistance(
        lastLocation.location,
        attempt.location,
      )
      const timeHours =
        (attempt.timestamp.getTime() -
          new Date(lastLocation.timestamp).getTime()) /
        1000 /
        3600

      if (timeHours === 0) {
        return {
          type: 'VELOCITY',
          severity: 'HIGH',
          message: 'Multiple locations at the same time',
          details: {
            distance: Math.round(distance),
            locations: [lastLocation.location, attempt.location],
          },
        }
      }

      const velocity = distance / timeHours

      if (velocity > this.VELOCITY_WARNING_KM_PER_HOUR) {
        return {
          type: 'VELOCITY',
          severity: velocity > 100 ? 'HIGH' : 'MEDIUM',
          message: `High travel speed: ${Math.round(velocity)} km/h`,
          details: {
            distance: Math.round(distance),
            timeHours: Math.round(timeHours * 10) / 10,
            velocity: Math.round(velocity),
          },
        }
      }

      return null
    } catch (error) {
      logger.error('Error checking velocity', { error, attempt })

      return null
    }
  }

  /**
   * Check for location anomalies
   */
  private async checkLocationAnomaly(
    attempt: RedemptionAttempt,
  ): Promise<FraudFlag | null> {
    if (!attempt.location) {
      return null
    }

    const key = `fraud:location_pattern:${attempt.customerId}`

    try {
      // Get user's redemption location history
      const locationHistory =
        (await this.cacheService.get<GeoPoint[]>(key)) || []

      if (locationHistory.length < 3) {
        // Not enough history to detect anomalies
        // Add current location to history
        const updated = [...locationHistory, attempt.location]

        await this.cacheService.set(key, updated, 86400 * 7) // 7 days

        return null
      }

      // Calculate average distance from historical locations
      const distances = locationHistory.map((loc) =>
        this.calculateDistance(loc, attempt.location!),
      )
      const avgDistance =
        distances.reduce((sum, d) => sum + d, 0) / distances.length

      // Update history (keep last 10 locations)
      const updated = [...locationHistory.slice(-9), attempt.location]

      await this.cacheService.set(key, updated, 86400 * 7)

      if (avgDistance > this.LOCATION_ANOMALY_KM) {
        return {
          type: 'LOCATION_ANOMALY',
          severity: avgDistance > 50 ? 'HIGH' : 'MEDIUM',
          message: `Unusual location: ${Math.round(avgDistance)}km from typical areas`,
          details: {
            averageDistance: Math.round(avgDistance),
            currentLocation: attempt.location,
          },
        }
      }

      return null
    } catch (error) {
      logger.error('Error checking location anomaly', { error, attempt })

      return null
    }
  }

  /**
   * Calculate risk score from flags
   */
  private calculateRiskScore(flags: FraudFlag[]): number {
    let score = 0

    for (const flag of flags) {
      switch (flag.severity) {
        case 'HIGH':
          score += 40
          break
        case 'MEDIUM':
          score += 20
          break
        case 'LOW':
          score += 10
          break
      }
    }

    return Math.min(score, 100)
  }

  /**
   * Log suspicious activity for dashboard display
   */
  private async logSuspiciousActivity(
    attempt: RedemptionAttempt,
    flags: FraudFlag[],
    riskScore: number,
  ): Promise<void> {
    const logEntry = {
      ...attempt,
      flags,
      riskScore,
      timestamp: attempt.timestamp.toISOString(),
    }

    try {
      // Log for customer history
      const customerKey = `fraud:log:customer:${attempt.customerId}`
      const customerLogs =
        (await this.cacheService.get<any[]>(customerKey)) || []

      await this.cacheService.set(
        customerKey,
        [...customerLogs.slice(-99), logEntry], // Keep last 100
        this.FRAUD_LOG_TTL,
      )

      // Log for provider dashboard
      const providerKey = `fraud:log:provider:${attempt.providerId}`
      const providerLogs =
        (await this.cacheService.get<any[]>(providerKey)) || []

      await this.cacheService.set(
        providerKey,
        [...providerLogs.slice(-99), logEntry], // Keep last 100
        this.FRAUD_LOG_TTL,
      )

      // Log for admin dashboard (sample of high-risk only)
      if (riskScore > 70) {
        const adminKey = 'fraud:log:admin:high_risk'
        const adminLogs = (await this.cacheService.get<any[]>(adminKey)) || []

        await this.cacheService.set(
          adminKey,
          [...adminLogs.slice(-99), logEntry], // Keep last 100
          this.FRAUD_LOG_TTL,
        )
      }

      logger.info('Suspicious activity logged', {
        customerId: attempt.customerId,
        providerId: attempt.providerId,
        riskScore,
        flagCount: flags.length,
      })
    } catch (error) {
      logger.error('Failed to log suspicious activity', { error, logEntry })
    }
  }

  /**
   * Get fraud logs for dashboard display
   */
  async getFraudLogs(
    type: 'customer' | 'provider' | 'admin',
    id?: string,
  ): Promise<any[]> {
    try {
      const key =
        type === 'admin'
          ? 'fraud:log:admin:high_risk'
          : `fraud:log:${type}:${id}`

      return (await this.cacheService.get<any[]>(key)) || []
    } catch (error) {
      logger.error('Error retrieving fraud logs', { error, type, id })

      return []
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLon = this.toRadians(point2.lng - point1.lng)
    const lat1 = this.toRadians(point1.lat)
    const lat2 = this.toRadians(point2.lat)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
