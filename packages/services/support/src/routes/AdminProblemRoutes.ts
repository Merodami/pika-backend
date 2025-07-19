import { supportAdmin, supportCommon } from '@pika/api'
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

import { AdminProblemController } from '../controllers/AdminProblemController.js'
import { ProblemRepository } from '../repositories/ProblemRepository.js'
import { ProblemService } from '../services/ProblemService.js'

export function createAdminProblemRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new ProblemRepository(prisma, cache)
  const service = new ProblemService(repository, cache)
  const controller = new AdminProblemController(service)

  // Admin problem management routes
  router.get(
    '/',
    requireAuth(),
    requireAdmin(),
    validateQuery(supportAdmin.AdminTicketQueryParams),
    controller.getAllProblems,
  )

  router.get(
    '/:id',
    requireAuth(),
    requireAdmin(),
    validateParams(supportCommon.ProblemIdParam),
    controller.getProblemById,
  )

  router.put(
    '/:id',
    requireAuth(),
    requireAdmin(),
    validateParams(supportCommon.ProblemIdParam),
    validateBody(supportAdmin.AdminUpdateProblemRequest),
    controller.updateProblem,
  )

  router.delete(
    '/:id',
    requireAuth(),
    requireAdmin(),
    validateParams(supportCommon.ProblemIdParam),
    controller.deleteProblem,
  )

  return router
}
