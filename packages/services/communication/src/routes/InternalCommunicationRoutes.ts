import {
  BatchCreateNotificationsRequest,
  BulkEmailRequest,
  CreateNotificationRequest,
  GetUnreadCountParams,
  InternalEmailHistoryParams,
  InternalNotificationsParams,
  SendEmailRequest,
  SendSystemNotificationRequest,
  SendTransactionalEmailRequest,
} from '@pika/api/internal'
import { requireServiceAuth, validateBody } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { InternalCommunicationController } from '../controllers/InternalCommunicationController.js'
import { CommunicationLogRepository } from '../repositories/CommunicationLogRepository.js'
import { NotificationRepository } from '../repositories/NotificationRepository.js'
import { type EmailConfig, EmailService } from '../services/EmailService.js'
import { NotificationService } from '../services/NotificationService.js'

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
  const notificationRepository = new NotificationRepository(prisma, cache)
  const emailService = new EmailService(
    communicationLogRepository,
    cache,
    emailConfig,
  )
  const notificationService = new NotificationService(
    notificationRepository,
    cache,
  )
  const controller = new InternalCommunicationController(
    emailService,
    notificationService,
  )

  // Apply service auth to all internal routes
  router.use(requireServiceAuth())

  // Email endpoints for internal services
  router.post(
    '/emails/send',
    validateBody(SendEmailRequest),
    controller.sendEmail,
  )

  router.post(
    '/emails/send-bulk',
    validateBody(BulkEmailRequest),
    controller.sendBulkEmail,
  )

  router.get(
    '/emails/history',
    // Query params don't need validation, they're coerced by Zod
    controller.getEmailHistory,
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

  router.post(
    '/notifications',
    validateBody(CreateNotificationRequest),
    controller.createNotification,
  )

  router.post(
    '/notifications/batch',
    validateBody(BatchCreateNotificationsRequest),
    controller.createBatchNotifications,
  )

  router.get(
    '/notifications',
    controller.getNotifications,
  )

  router.get(
    '/notifications/unread-count',
    controller.getUnreadCount,
  )

  return router
}
