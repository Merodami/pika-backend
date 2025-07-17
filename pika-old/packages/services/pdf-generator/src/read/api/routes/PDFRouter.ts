import { PDFController } from '@pdf-read/api/controllers/pdf/index.js'
import {
  GetAllVoucherBooksHandler,
  GetVoucherBookByIdHandler,
} from '@pdf-read/application/use_cases/queries/index.js'
import { PDFReadRepositoryPort } from '@pdf-read/domain/port/pdf/PDFReadRepositoryPort.js'
import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for PDF generator read endpoints
 *
 * @param pdfRepository - Repository for PDF data access
 * @returns Fastify plugin for PDF routes
 */
export function createPDFReadRouter(
  pdfRepository: PDFReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllVoucherBooksHandler = new GetAllVoucherBooksHandler(
      pdfRepository,
    )
    const getVoucherBookByIdHandler = new GetVoucherBookByIdHandler(
      pdfRepository,
    )

    // Initialize controller with the handlers
    const pdfController = new PDFController(
      getAllVoucherBooksHandler,
      getVoucherBookByIdHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all voucher books with filtering and pagination
    fastify.get<{
      Querystring: schemas.VoucherBookSearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.VoucherBookSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.VoucherBookSearchQuery
        }>,
        reply,
      ) => {
        const result = await pdfController.getAllVoucherBooks(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific voucher book by ID
    fastify.get<{
      Params: schemas.VoucherBookId
    }>(
      '/:book_id',
      {
        schema: {
          params: schemas.VoucherBookIdSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.VoucherBookId
        }>,
        reply,
      ) => {
        const result = await pdfController.getVoucherBookById(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )
  }
}
