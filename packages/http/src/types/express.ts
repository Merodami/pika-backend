import { ICacheService } from '@pika/redis'
import { BusinessRegistrationStatus,UserRole } from '@pika/types'

declare global {
  namespace Express {
    interface Request {
      correlationId?: string
      user?: {
        id: string
        email: string
        role: UserRole
        type?: string
        permissions?: string[]
        sessionId?: string
        issuedAt?: Date
        expiresAt?: Date
        // Business-specific claims (only for business users)
        hasActiveBusinesses?: boolean
      }
      serviceAuth?: {
        serviceId: string
        serviceName: string
        isInternalService: boolean
      }
      businessId?: string // Set by requireBusinessRegistration middleware
      businessContext?: {
        hasRegistration: boolean
        registrationStatus?: BusinessRegistrationStatus
        isApproved: boolean
        businessId?: string
        isBusinessActive: boolean
        isBusinessApproved: boolean
        isFullyOperational: boolean
      }
      accepts?: any
    }

    interface Application {
      cacheService?: ICacheService
    }
  }
}

export {}
