import {
    SendEmailRequest,
    SendSystemNotificationRequest,
    SendTransactionalEmailRequest,
} from '@pika/api/internal'
import type { ICacheService } from '@pika/redis'
import { requireServiceAuth, validateBody } from '@pika/http'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { InternalCommunicationController } from '../controllers/InternalCommunicationController.js'
import { CommunicationLogRepository } from '../repositories/CommunicationLogRepository.js'
import { type EmailConfig, EmailService } from '../services/EmailService.js'

/**
 * Internal API routes for service-to-service communication
 * These routes are protected by service authentication
 */
export function createInternalCommunicationRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  emailConfig: EmailConfig,
): Router {
  const router = Router()

  // Create instances
  const communicationLogRepository = new CommunicationLogRepository(
    prisma,
    cache,
  )
  const emailService = new EmailService(
    communicationLogRepository,
    cache,
    emailConfig,
  )
  const controller = new InternalCommunicationController(emailService)

  // Apply service auth to all internal routes
  router.use(requireServiceAuth())

  // Email endpoints for internal services
  router.post(
    '/emails/send',
    validateBody(SendEmailRequest),
    controller.sendEmail,
  )

  router.post(
    '/emails/transactional',
    validateBody(SendTransactionalEmailRequest),
    controller.sendTransactionalEmail,
  )

  // Notification endpoints for internal services
  router.post(
    '/notifications/system',
    validateBody(SendSystemNotificationRequest),
    controller.sendSystemNotification,
  )

  return router
}
