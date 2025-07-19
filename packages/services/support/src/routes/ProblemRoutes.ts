import { supportPublic } from '@pika/api'
import type { ICacheService } from '@pika/redis'
import { requireAuth, validateBody } from '@pika/http'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { ProblemController } from '../controllers/ProblemController.js'
import { ProblemRepository } from '../repositories/ProblemRepository.js'
import { ProblemService } from '../services/ProblemService.js'

export function createProblemRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const repository = new ProblemRepository(prisma, cache)

  // Initialize service
  const service = new ProblemService(repository, cache)

  // Initialize controller
  const controller = new ProblemController(service)

  // Public user routes only
  router.post(
    '/',
    requireAuth(),
    validateBody(supportPublic.CreateSupportProblemRequest),
    controller.createProblem,
  )

  router.get('/', requireAuth(), controller.getUserProblems)

  return router
}
