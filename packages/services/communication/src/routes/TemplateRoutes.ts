import {
  CreateTemplateRequest,
  TemplateIdParam,
  TemplateSearchParams,
  TestTemplateRequest,
  UpdateTemplateRequest,
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
    validateQuery(TemplateSearchParams),
    controller.getTemplates,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(TemplateIdParam),
    controller.getTemplateById,
  )

  // Admin routes
  router.post(
    '/',
    requireAdmin(),
    validateBody(CreateTemplateRequest),
    controller.createTemplate,
  )

  router.put(
    '/:id',
    requireAdmin(),
    validateParams(TemplateIdParam),
    validateBody(UpdateTemplateRequest),
    controller.updateTemplate,
  )

  router.delete(
    '/:id',
    requireAdmin(),
    validateParams(TemplateIdParam),
    controller.deleteTemplate,
  )

  router.post(
    '/validate',
    requireAuth(),
    validateBody(TestTemplateRequest),
    controller.validateTemplate,
  )

  router.post('/seed', requireAdmin(), controller.seedTemplates)

  return router
}
