import { AdPlacementController } from '@pdf-write/api/controllers/pdf/AdPlacementController.js'
import { VoucherBookPageController } from '@pdf-write/api/controllers/pdf/VoucherBookPageController.js'
import {
  CreateVoucherBookPageCommandHandler,
  DeleteVoucherBookPageCommandHandler,
  UpdateVoucherBookPageCommandHandler,
} from '@pdf-write/application/use_cases/commands/pages/index.js'
import {
  CreateAdPlacementCommandHandler,
  DeleteAdPlacementCommandHandler,
  UpdateAdPlacementCommandHandler,
} from '@pdf-write/application/use_cases/commands/placements/index.js'
import { AdPlacementWriteRepositoryPort } from '@pdf-write/domain/port/AdPlacementWriteRepositoryPort.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { schemas } from '@pika/api'
import { propertyTransformerHook, requirePermissions } from '@pika/http'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for voucher book page and ad placement endpoints
 */
export function createVoucherBookPageRouter(
  pageRepository: VoucherBookPageWriteRepositoryPort,
  adPlacementRepository: AdPlacementWriteRepositoryPort,
  bookRepository: PDFWriteRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Register property name transformer hook
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize page handlers
    const createPageHandler = new CreateVoucherBookPageCommandHandler(
      pageRepository,
      bookRepository,
    )
    const updatePageHandler = new UpdateVoucherBookPageCommandHandler(
      pageRepository,
      bookRepository,
    )
    const deletePageHandler = new DeleteVoucherBookPageCommandHandler(
      pageRepository,
      bookRepository,
    )

    // Initialize page controller
    const pageController = new VoucherBookPageController(
      createPageHandler,
      updatePageHandler,
      deletePageHandler,
    )

    // Initialize ad placement handlers
    const createPlacementHandler = new CreateAdPlacementCommandHandler(
      adPlacementRepository,
      pageRepository,
      bookRepository,
    )
    const updatePlacementHandler = new UpdateAdPlacementCommandHandler(
      adPlacementRepository,
      pageRepository,
      bookRepository,
    )
    const deletePlacementHandler = new DeleteAdPlacementCommandHandler(
      adPlacementRepository,
      pageRepository,
      bookRepository,
    )

    // Initialize ad placement controller
    const placementController = new AdPlacementController(
      createPlacementHandler,
      updatePlacementHandler,
      deletePlacementHandler,
    )

    // Page routes
    fastify.post<{
      Params: { book_id: string }
      Body: schemas.VoucherBookPageCreate
    }>(
      '/:book_id/pages',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookIdSchema,
          body: schemas.VoucherBookPageCreateSchema,
        },
      },
      async (request, reply) => {
        await pageController.createPage(request as any, reply)
      },
    )

    fastify.patch<{
      Params: { book_id: string; page_id: string }
      Body: schemas.VoucherBookPageUpdate
    }>(
      '/:book_id/pages/:page_id',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookPageIdSchema,
          body: schemas.VoucherBookPageUpdateSchema,
        },
      },
      async (request, reply) => {
        await pageController.updatePage(request, reply)
      },
    )

    fastify.delete<{
      Params: { book_id: string; page_id: string }
    }>(
      '/:book_id/pages/:page_id',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookPageIdSchema,
        },
      },
      async (request, reply) => {
        await pageController.deletePage(request, reply)
      },
    )

    // Ad placement routes
    fastify.post<{
      Params: { book_id: string; page_id: string }
      Body: schemas.AdPlacementCreate
    }>(
      '/:book_id/pages/:page_id/placements',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookPageIdSchema,
          body: schemas.AdPlacementCreateSchema,
        },
      },
      async (request, reply) => {
        await placementController.createPlacement(request as any, reply)
      },
    )

    fastify.patch<{
      Params: { book_id: string; page_id: string; placement_id: string }
      Body: schemas.AdPlacementUpdate
    }>(
      '/:book_id/pages/:page_id/placements/:placement_id',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.AdPlacementIdSchema,
          body: schemas.AdPlacementUpdateSchema,
        },
      },
      async (request, reply) => {
        await placementController.updatePlacement(request, reply)
      },
    )

    fastify.delete<{
      Params: { book_id: string; page_id: string; placement_id: string }
    }>(
      '/:book_id/pages/:page_id/placements/:placement_id',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.AdPlacementIdSchema,
        },
      },
      async (request, reply) => {
        await placementController.deletePlacement(request, reply)
      },
    )
  }
}
