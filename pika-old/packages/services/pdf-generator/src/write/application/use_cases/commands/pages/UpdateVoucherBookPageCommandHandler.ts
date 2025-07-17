import { VoucherBookPageUpdateDTO } from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import {
  BaseError,
  ErrorFactory,
  logger,
  NotAuthorizedError,
} from '@pika/shared'

export class UpdateVoucherBookPageCommandHandler {
  constructor(
    private readonly pageRepository: VoucherBookPageWriteRepositoryPort,
    private readonly bookRepository: PDFWriteRepositoryPort,
  ) {}

  async execute(
    pageId: string,
    dto: VoucherBookPageUpdateDTO,
    context: UserContext,
  ): Promise<any> {
    try {
      // Validate that the page exists
      const page = await this.pageRepository.findById(pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound('VoucherBookPage', pageId, {
          source: 'UpdateVoucherBookPageCommandHandler.execute',
        })
      }

      // Get the book to check authorization
      const book = await this.bookRepository.findVoucherBookById(page.bookId)

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', page.bookId, {
          source: 'UpdateVoucherBookPageCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can update pages
      if (!RequestContext.isAdmin(context)) {
        const bookData = book.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to update pages for this voucher book',
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

      // Update the page
      const updatedPage = await this.pageRepository.updatePage(pageId, dto)

      logger.info('VoucherBookPage updated', { pageId })

      return updatedPage
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }

      throw ErrorFactory.fromError(
        'Failed to update voucher book page',
        error,
        {
          source: 'UpdateVoucherBookPageCommandHandler.execute',
          metadata: { pageId },
        },
      )
    }
  }
}
