import {
    CreateNotificationRequest,
    NotificationIdParam,
    NotificationSearchParams,
    UpdateNotificationStatusRequest,
} from '@pika/api/public'
import type { ICacheService } from '@pika/redis'
import {
    requireAdmin,
    requireAuth,
    validateBody,
    validateParams,
    validateQuery,
} from '@pika/http'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { NotificationController } from '../controllers/NotificationController.js'
import { CommunicationLogRepository } from '../repositories/CommunicationLogRepository.js'
import { NotificationRepository } from '../repositories/NotificationRepository.js'
import type { EmailConfig } from '../services/EmailService.js'
import { EmailService } from '../services/EmailService.js'
import { NotificationService } from '../services/NotificationService.js'

export function createNotificationRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  emailConfig: EmailConfig,
): Router {
  const router = Router()

  // Initialize repositories
  const notificationRepository = new NotificationRepository(prisma, cache)
  const communicationLogRepository = new CommunicationLogRepository(
    prisma,
    cache,
  )
  // Initialize services
  const emailService = new EmailService(
    communicationLogRepository,
    cache,
    emailConfig,
  )
  const notificationService = new NotificationService(
    notificationRepository,
    emailService,
    cache,
  )

  // Initialize controller
  const controller = new NotificationController(notificationService)

  // Notification routes
  router.post(
    '/',
    requireAuth(),
    validateBody(CreateNotificationRequest),
    controller.createNotification,
  )

  router.get(
    '/',
    requireAuth(),
    validateQuery(NotificationSearchParams),
    controller.getNotifications,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(NotificationIdParam),
    controller.getNotificationById,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(NotificationIdParam),
    validateBody(UpdateNotificationStatusRequest),
    controller.updateNotification,
  )

  router.put(
    '/:id/read',
    requireAuth(),
    validateParams(NotificationIdParam),
    controller.markAsRead,
  )

  router.put('/read-all', requireAuth(), controller.markAllAsRead)

  router.delete(
    '/:id',
    requireAuth(),
    validateParams(NotificationIdParam),
    controller.deleteNotification,
  )

  // Admin routes
  router.post(
    '/global',
    requireAdmin(),
    validateBody(CreateNotificationRequest),
    controller.createGlobalNotification,
  )

  // Legacy admin notification endpoint for backward compatibility
  router.post(
    '/admin/notification',
    requireAdmin(),
    validateBody(CreateNotificationRequest),
    controller.createGlobalNotification,
  )

  return router
}
