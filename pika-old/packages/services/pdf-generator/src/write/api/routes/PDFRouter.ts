import fastifyMultipart from '@fastify/multipart'
import { PDFController } from '@pdf-write/api/controllers/pdf/PDFController.js'
import {
  CreateVoucherBookCommandHandler,
  DeleteVoucherBookCommandHandler,
  GeneratePDFCommandHandler,
  UpdateVoucherBookCommandHandler,
  UpdateVoucherBookStatusCommandHandler,
} from '@pdf-write/application/use_cases/commands/index.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { CryptoServiceAdapter } from '@pdf-write/infrastructure/services/CryptoServiceAdapter.js'
import { PageLayoutEngine } from '@pdf-write/infrastructure/services/PageLayoutEngine.js'
import { PDFGenerationService } from '@pdf-write/infrastructure/services/PDFGenerationService.js'
import { PDFGenerationRateLimiter } from '@pdf-write/infrastructure/services/PDFRateLimiter.js'
import { VoucherServiceClient } from '@pdf-write/infrastructure/services/VoucherServiceClient.js'
import { schemas } from '@pika/api'
import { PROVIDER_API_URL } from '@pika/environment'
import { propertyTransformerHook, requirePermissions } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger, ProviderServiceClient } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for PDF generator write endpoints
 *
 * @param pdfRepository - Repository for PDF write operations
 * @param fileStorage - Storage service for handling file uploads
 * @param cacheService - Cache service for rate limiting
 * @returns Fastify plugin for PDF write routes
 */
export function createPDFWriteRouter(
  pdfRepository: PDFWriteRepositoryPort,
  fileStorage: FileStoragePort,
  cacheService: ICacheService,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Check if multipart is already registered to avoid duplicate registration
    if (!fastify.hasContentTypeParser('multipart/form-data')) {
      // Register multipart plugin for file uploads
      fastify.register(fastifyMultipart, {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
          files: 1, // Maximum one file per request
          fields: 10, // Maximum fields in the request
        },
      })

      logger.info('Registered multipart handler for file uploads')
    } else {
      logger.info('Multipart handler already registered')
    }

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize use case handlers
    const createHandler = new CreateVoucherBookCommandHandler(pdfRepository)
    const updateHandler = new UpdateVoucherBookCommandHandler(pdfRepository)
    const updateStatusHandler = new UpdateVoucherBookStatusCommandHandler(
      pdfRepository,
    )
    const deleteHandler = new DeleteVoucherBookCommandHandler(pdfRepository)

    // Initialize services for PDF generation
    const pdfGenerationService = new PDFGenerationService()
    const pageLayoutEngine = new PageLayoutEngine()
    const voucherServiceClient = new VoucherServiceClient()
    const cryptoServiceAdapter = new CryptoServiceAdapter()
    const providerServiceClient = new ProviderServiceClient(PROVIDER_API_URL)
    const rateLimiter = new PDFGenerationRateLimiter(cacheService)

    const generatePDFHandler = new GeneratePDFCommandHandler(
      pdfRepository,
      fileStorage,
      pdfGenerationService,
      pageLayoutEngine,
      voucherServiceClient,
      cryptoServiceAdapter,
      providerServiceClient,
      rateLimiter,
    )

    // Initialize controller with the handlers and file storage
    const pdfController = new PDFController(
      createHandler,
      updateHandler,
      updateStatusHandler,
      deleteHandler,
      generatePDFHandler,
      fileStorage,
      rateLimiter,
    )

    // Route for creating a voucher book
    fastify.post<{
      Body: schemas.VoucherBookCreate
    }>(
      '/',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          body: schemas.VoucherBookCreateSchema,
        },
      },
      async (request, reply) => {
        await pdfController.create(request, reply)
      },
    )

    // Route for updating a voucher book
    fastify.patch<{
      Params: { book_id: string }
      Body: schemas.VoucherBookUpdate
    }>(
      '/:book_id',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookIdSchema,
          body: schemas.VoucherBookUpdateSchema,
        },
      },
      async (request, reply) => {
        await pdfController.update(request, reply)
      },
    )

    // Route for updating voucher book status
    fastify.patch<{
      Params: { book_id: string }
      Body: schemas.VoucherBookStatusUpdate
    }>(
      '/:book_id/status',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookIdSchema,
          body: schemas.VoucherBookStatusUpdateSchema,
        },
      },
      async (request, reply) => {
        await pdfController.updateStatus(request, reply)
      },
    )

    // Route for deleting a voucher book
    fastify.delete<{
      Params: { book_id: string }
    }>(
      '/:book_id',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookIdSchema,
        },
      },
      async (request, reply) => {
        await pdfController.delete(request, reply)
      },
    )

    // Route for uploading a voucher book cover image
    fastify.post<{
      Params: { book_id: string }
    }>(
      '/:book_id/cover',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookIdSchema,
        },
      },
      async (request, reply) => {
        await pdfController.uploadCover(request, reply)
      },
    )

    // Route for generating PDF
    fastify.post<{
      Params: { book_id: string }
    }>(
      '/:book_id/generate',
      {
        preHandler: requirePermissions('pdf:write'),
        schema: {
          params: schemas.VoucherBookIdSchema,
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                pdf_url: { type: 'string' },
                generated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      async (request, reply) => {
        await pdfController.generatePDF(request, reply)
      },
    )

    // Route for checking rate limit status
    fastify.get(
      '/rate-limit',
      {
        preHandler: requirePermissions('pdf:read'),
        schema: {
          response: {
            200: schemas.RateLimitStatusSchema,
          },
        },
      },
      async (request, reply) => {
        await pdfController.getRateLimitStatus(request, reply)
      },
    )
  }
}
