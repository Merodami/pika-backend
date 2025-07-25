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

import { EmailController } from '../controllers/EmailController.js'
import { CommunicationLogRepository } from '../repositories/CommunicationLogRepository.js'
import { type EmailConfig, EmailService } from '../services/EmailService.js'

export function createEmailRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  emailConfig: EmailConfig,
): Router {
  const router = Router()

  // Initialize repositories
  const communicationLogRepository = new CommunicationLogRepository(
    prisma,
    cache,
  )

  // Initialize service
  const emailService = new EmailService(
    communicationLogRepository,
    cache,
    emailConfig,
  )

  // Initialize controller
  const controller = new EmailController(emailService)

  // Email routes
  router.post(
    '/send',
    requireAuth(),
    validateBody(communicationPublic.SendEmailRequest),
    controller.sendEmail,
  )

  // ADMIN ENDPOINTS EXCLUDED - Bulk email functionality moved to internal routes
  // router.post(
  //   '/send-bulk',
  //   requireAdmin(),
  //   validateBody(communicationPublic.SendBulkEmailRequest),
  //   controller.sendBulkEmail,
  // )

  router.get(
    '/history',
    requireAuth(),
    validateQuery(communicationPublic.CommunicationLogSearchParams),
    controller.getEmailHistory,
  )

  router.get(
    '/history/:id',
    requireAuth(),
    validateParams(communicationCommon.CommunicationLogIdParam),
    controller.getEmailById,
  )

  return router
}
