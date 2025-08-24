import { NotAuthenticatedError, NotAuthorizedError } from '@pika/shared'
import { BusinessRegistrationStatus, UserRole } from '@pika/types'
import { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Lightweight middleware that checks if business user has at least one active business
 * This middleware should be used AFTER auth middleware, as it relies on JWT claims
 *
 * Benefits:
 * - No database calls needed (uses JWT claims)
 * - Fast validation on every request
 * - Stateless and scalable
 *
 * Usage:
 * router.get('/route', requireAuth(), requireActiveBusinesses(), handler)
 */
export function requireActiveBusinesses(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if user is not authenticated
      if (!req.user) {
        return next(new NotAuthenticatedError('Authentication required'))
      }

      // Skip if user is admin (admins can bypass all checks)
      if (req.user.role === UserRole.ADMIN) {
        return next()
      }

      // Skip if user is not a business role
      if (req.user.role !== UserRole.BUSINESS) {
        return next()
      }

      // Check if user has at least one active business from JWT claims
      const hasActiveBusinesses = req.user.hasActiveBusinesses

      // If user doesn't have any active businesses, block access
      if (!hasActiveBusinesses) {
        throw new NotAuthorizedError(
          'You need at least one active business to access this feature. Please complete your business registration or ensure your business is active and approved.',
          {
            userId: req.user.id,
            correlationId: req.correlationId,
            metadata: {
              errorType: 'NO_ACTIVE_BUSINESSES',
            },
          },
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Keep old name for backwards compatibility
export const requireBusinessRegistration = requireActiveBusinesses

/**
 * Alternative middleware that allows partial registration
 * Use this for routes where business users can access with incomplete registration
 * but with limited functionality
 */
export function checkBusinessRegistration(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if user is not authenticated or not a business role
    if (!req.user || req.user.role !== UserRole.BUSINESS) {
      return next()
    }

    // Extract business data from JWT claims
    const businessRegistrationStatus = (req.user as any)
      .businessRegistrationStatus
    const businessId = (req.user as any).businessId
    const businessActive = (req.user as any).businessActive
    const businessApproved = (req.user as any).businessApproved

    // Attach business registration context to request
    req.businessContext = {
      hasRegistration: !!businessRegistrationStatus,
      registrationStatus: businessRegistrationStatus,
      isApproved:
        businessRegistrationStatus === BusinessRegistrationStatus.APPROVED,
      businessId,
      isBusinessActive: businessActive === true,
      isBusinessApproved: businessApproved === true,
      isFullyOperational:
        businessRegistrationStatus === BusinessRegistrationStatus.APPROVED &&
        businessActive === true &&
        businessApproved === true &&
        !!businessId,
    }

    next()
  }
}
