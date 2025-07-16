import {
  AdminTicketQueryParams,
  AssignTicketRequest,
  TicketIdParam,
  UpdateTicketStatusRequest,
} from '@pika/api/admin'
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
    requireAdmin(),
    validateQuery(AdminTicketQueryParams),
    controller.getAllTickets,
  )

  router.get(
    '/tickets/:id',
    requireAuth(),
    requireAdmin(),
    validateParams(TicketIdParam),
    controller.getTicketById,
  )

  router.put(
    '/tickets/:id/status',
    requireAuth(),
    requireAdmin(),
    validateParams(TicketIdParam),
    validateBody(UpdateTicketStatusRequest),
    controller.updateTicketStatus,
  )

  router.post(
    '/tickets/:id/assign',
    requireAuth(),
    requireAdmin(),
    validateParams(TicketIdParam),
    validateBody(AssignTicketRequest),
    controller.assignTicket,
  )

  return router
}
