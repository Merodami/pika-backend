import {
  CommunicationLogIdParam,
  CommunicationLogSearchParams,
  SendBulkEmailRequest,
  SendEmailRequest,
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
    validateBody(SendEmailRequest),
    controller.sendEmail,
  )

  router.post(
    '/send-bulk',
    requireAdmin(),
    validateBody(SendBulkEmailRequest),
    controller.sendBulkEmail,
  )

  router.get(
    '/history',
    requireAuth(),
    validateQuery(CommunicationLogSearchParams),
    controller.getEmailHistory,
  )

  router.get(
    '/history/:id',
    requireAuth(),
    validateParams(CommunicationLogIdParam),
    controller.getEmailById,
  )

  return router
}
