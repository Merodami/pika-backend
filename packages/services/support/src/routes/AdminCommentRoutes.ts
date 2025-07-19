import { supportPublic, supportCommon } from '@pika/api'
import type { ICacheService } from '@pika/redis'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
} from '@pika/http'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { AdminCommentController } from '../controllers/AdminCommentController.js'
import { SupportCommentRepository } from '../repositories/SupportCommentRepository.js'
import { AdminSupportCommentService } from '../services/AdminSupportCommentService.js'

export function createAdminCommentRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new SupportCommentRepository(prisma, cache)
  const service = new AdminSupportCommentService(repository, cache)
  const controller = new AdminCommentController(service)

  // Admin comment management routes
  router.get('/', requireAuth(), requireAdmin(), controller.getAllComments)

  router.get(
    '/problem/:problemId',
    requireAuth(),
    requireAdmin(),
    validateParams(supportCommon.ProblemIdForCommentsParam),
    controller.getCommentsByProblemId,
  )

  router.post(
    '/',
    requireAuth(),
    requireAdmin(),
    validateBody(supportPublic.CreateSupportCommentRequest),
    controller.createInternalComment,
  )

  router.put(
    '/:id',
    requireAuth(),
    requireAdmin(),
    validateParams(supportCommon.SupportCommentIdParam),
    validateBody(supportPublic.UpdateSupportCommentRequest),
    controller.updateAnyComment,
  )

  router.delete(
    '/:id',
    requireAuth(),
    requireAdmin(),
    validateParams(supportCommon.SupportCommentIdParam),
    controller.deleteAnyComment,
  )

  return router
}
