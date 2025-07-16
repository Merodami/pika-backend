import {
    CreateSupportCommentRequest,
    ProblemIdForCommentsParam,
    SupportCommentIdParam,
    UpdateSupportCommentRequest,
} from '@pika/api/public'
import type { ICacheService } from '@pika/redis'
import { requireAuth, validateBody, validateParams } from '@pika/http'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { SupportCommentController } from '../controllers/SupportCommentController.js'
import { SupportCommentRepository } from '../repositories/SupportCommentRepository.js'
import { SupportCommentService } from '../services/SupportCommentService.js'

export function createSupportCommentRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const repository = new SupportCommentRepository(prisma, cache)

  // Initialize service
  const service = new SupportCommentService(repository, cache)

  // Initialize controller
  const controller = new SupportCommentController(service)

  // Comment routes (all require authentication)
  router.get(
    '/problem/:problemId',
    requireAuth(),
    validateParams(ProblemIdForCommentsParam),
    controller.getCommentsByProblemId,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(SupportCommentIdParam),
    controller.getCommentById,
  )

  router.post(
    '/',
    requireAuth(),
    validateBody(CreateSupportCommentRequest),
    controller.createComment,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(SupportCommentIdParam),
    validateBody(UpdateSupportCommentRequest),
    controller.updateComment,
  )

  router.delete(
    '/:id',
    requireAuth(),
    validateParams(SupportCommentIdParam),
    controller.deleteComment,
  )

  return router
}
