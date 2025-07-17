import { AdPlacementWriteRepositoryPort } from '@pdf-write/domain/port/AdPlacementWriteRepositoryPort.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import {
  BaseError,
  ErrorFactory,
  logger,
  NotAuthorizedError,
} from '@pika/shared'

export class DeleteAdPlacementCommandHandler {
  constructor(
    private readonly adPlacementRepository: AdPlacementWriteRepositoryPort,
    private readonly pageRepository: VoucherBookPageWriteRepositoryPort,
    private readonly bookRepository: PDFWriteRepositoryPort,
  ) {}

  async execute(placementId: string, context: UserContext): Promise<void> {
    try {
      // Validate that the placement exists
      const placement = await this.adPlacementRepository.findById(placementId)

      if (!placement) {
        throw ErrorFactory.resourceNotFound('AdPlacement', placementId, {
          source: 'DeleteAdPlacementCommandHandler.execute',
        })
      }

      // Get the page and book to check status
      const page = await this.pageRepository.findById(placement.pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound(
          'VoucherBookPage',
          placement.pageId,
          {
            source: 'DeleteAdPlacementCommandHandler.execute',
          },
        )
      }

      const book = await this.bookRepository.findVoucherBookById(page.bookId)

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', page.bookId, {
          source: 'DeleteAdPlacementCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can delete ad placements
      if (!RequestContext.isAdmin(context)) {
        const bookData = book.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to delete ad placements from this voucher book',
            {
              metadata: {
                userId: context.userId,
                bookId: page.bookId,
                createdBy: bookData.createdBy,
                providerId: bookData.providerId,
              },
            },
          )
        }
      }

      if (book.status !== 'DRAFT') {
        throw ErrorFactory.validationError(
          { status: ['Only ad placements in draft books can be deleted'] },
          { source: 'DeleteAdPlacementCommandHandler.execute' },
        )
      }

      // Delete the placement
      await this.adPlacementRepository.deletePlacement(placementId)

      logger.info('Ad placement deleted', { placementId })
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }

      throw ErrorFactory.fromError('Failed to delete ad placement', error, {
        source: 'DeleteAdPlacementCommandHandler.execute',
        metadata: { placementId },
      })
    }
  }
}
