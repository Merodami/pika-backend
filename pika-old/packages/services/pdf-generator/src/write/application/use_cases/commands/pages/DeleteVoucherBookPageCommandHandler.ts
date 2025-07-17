import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory, logger, NotAuthorizedError } from '@pika/shared'

export class DeleteVoucherBookPageCommandHandler {
  constructor(
    private readonly pageRepository: VoucherBookPageWriteRepositoryPort,
    private readonly bookRepository: PDFWriteRepositoryPort,
  ) {}

  async execute(pageId: string, context: UserContext): Promise<void> {
    try {
      // Validate that the page exists
      const page = await this.pageRepository.findById(pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound('VoucherBookPage', pageId, {
          source: 'DeleteVoucherBookPageCommandHandler.execute',
        })
      }

      // Check if book is in a valid state
      const book = await this.bookRepository.findVoucherBookById(page.bookId)

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', page.bookId, {
          source: 'DeleteVoucherBookPageCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can delete pages
      if (!RequestContext.isAdmin(context)) {
        const bookData = book.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to delete pages from this voucher book',
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
          { status: ['Only pages in draft books can be deleted'] },
          { source: 'DeleteVoucherBookPageCommandHandler.execute' },
        )
      }

      // Delete the page (will cascade delete ad placements)
      await this.pageRepository.deletePage(pageId)

      logger.info('VoucherBookPage deleted', { pageId })
    } catch (error) {
      if (error instanceof ErrorFactory) {
        throw error
      }

      throw ErrorFactory.fromError(
        'Failed to delete voucher book page',
        error,
        {
          source: 'DeleteVoucherBookPageCommandHandler.execute',
          metadata: { pageId },
        },
      )
    }
  }
}
