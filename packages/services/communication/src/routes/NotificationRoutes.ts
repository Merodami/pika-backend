import { communicationCommon, communicationPublic } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
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
    validateBody(communicationPublic.CreateNotificationRequest),
    controller.createNotification,
  )

  router.get(
    '/',
    requireAuth(),
    validateQuery(communicationPublic.NotificationSearchParams),
    controller.getNotifications,
  )

  // Place specific routes before parameterized routes
  router.put('/read-all', requireAuth(), controller.markAllAsRead)

  router.get(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    controller.getNotificationById,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    validateBody(communicationPublic.UpdateNotificationStatusRequest),
    controller.updateNotification,
  )

  router.put(
    '/:id/read',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    controller.markAsRead,
  )

  router.delete(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    controller.deleteNotification,
  )

  // ADMIN ENDPOINTS EXCLUDED - Global notification functionality moved to internal routes
  // router.post(
  //   '/global',
  //   requireAdmin(),
  //   validateBody(communicationPublic.CreateNotificationRequest),
  //   controller.createGlobalNotification,
  // )

  return router
}
