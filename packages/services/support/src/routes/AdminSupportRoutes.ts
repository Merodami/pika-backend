import { supportAdmin, supportCommon } from '@pika/api'
import {
  requirePermissions,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { AdminSupportController } from '../controllers/AdminSupportController.js'
import { ProblemRepository } from '../repositories/ProblemRepository.js'
import { ProblemService } from '../services/ProblemService.js'

export function createAdminSupportRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new ProblemRepository(prisma, cache)
  const service = new ProblemService(repository, cache)
  const controller = new AdminSupportController(service)

  // Admin ticket management routes
  router.get(
    '/tickets',
    requireAuth(),
    requirePermissions('admin:support'),
    validateQuery(supportAdmin.AdminTicketQueryParams),
    controller.getAllTickets,
  )

  router.get(
    '/tickets/:id',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.TicketIdParam),
    controller.getTicketById,
  )

  router.put(
    '/tickets/:id/status',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.TicketIdParam),
    validateBody(supportAdmin.UpdateTicketStatusRequest),
    controller.updateTicketStatus,
  )

  router.post(
    '/tickets/:id/assign',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.TicketIdParam),
    validateBody(supportAdmin.AssignTicketRequest),
    controller.assignTicket,
  )

  return router
}
