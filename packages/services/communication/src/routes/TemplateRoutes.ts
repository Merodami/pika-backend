import { communicationCommon, communicationPublic } from '@pika/api'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { TemplateController } from '../controllers/TemplateController.js'
import { TemplateRepository } from '../repositories/TemplateRepository.js'
import { TemplateService } from '../services/TemplateService.js'

export function createTemplateRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const templateRepository = new TemplateRepository(prisma, cache)

  // Initialize service
  const templateService = new TemplateService(templateRepository, cache)

  // Initialize controller
  const controller = new TemplateController(templateService)

  // Template routes
  router.get(
    '/',
    requireAuth(),
    validateQuery(communicationPublic.TemplateSearchParams),
    controller.getTemplates,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.TemplateIdParam),
    controller.getTemplateById,
  )

  // Admin routes
  router.post(
    '/',
    requireAdmin(),
    validateBody(communicationPublic.CreateTemplateRequest),
    controller.createTemplate,
  )

  router.put(
    '/:id',
    requireAdmin(),
    validateParams(communicationCommon.TemplateIdParam),
    validateBody(communicationPublic.UpdateTemplateRequest),
    controller.updateTemplate,
  )

  router.delete(
    '/:id',
    requireAdmin(),
    validateParams(communicationCommon.TemplateIdParam),
    controller.deleteTemplate,
  )

  router.post(
    '/validate',
    requireAuth(),
    validateBody(communicationPublic.TestTemplateRequest),
    controller.validateTemplate,
  )

  router.post('/seed', requireAdmin(), controller.seedTemplates)

  return router
}
