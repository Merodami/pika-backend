import { VoucherBookPageCreateDTO } from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory, logger, NotAuthorizedError } from '@pika/shared'

export class CreateVoucherBookPageCommandHandler {
  constructor(
    private readonly pageRepository: VoucherBookPageWriteRepositoryPort,
    private readonly bookRepository: PDFWriteRepositoryPort,
  ) {}

  async execute(
    bookId: string,
    dto: VoucherBookPageCreateDTO,
    context: UserContext,
  ): Promise<any> {
    try {
      // Validate that the book exists
      const book = await this.bookRepository.findVoucherBookById(bookId)

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', bookId, {
          source: 'CreateVoucherBookPageCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can create pages
      if (!RequestContext.isAdmin(context)) {
        const bookData = book.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to create pages for this voucher book',
            {
              metadata: {
                userId: context.userId,
                bookId: bookId,
                createdBy: bookData.createdBy,
                providerId: bookData.providerId,
              },
            },
          )
        }
      }

      // Check if book is in a valid state
      if (book.status !== 'DRAFT') {
        throw ErrorFactory.validationError(
          { status: ['Only draft books can have pages added'] },
          { source: 'CreateVoucherBookPageCommandHandler.execute' },
        )
      }

      // Check if page number already exists
      const existingPage = await this.pageRepository.findByBookIdAndPageNumber(
        bookId,
        dto.pageNumber,
      )

      if (existingPage) {
        throw ErrorFactory.resourceConflict(
          'VoucherBookPage',
          `Page ${dto.pageNumber} already exists for this book`,
          {
            source: 'CreateVoucherBookPageCommandHandler.execute',
            metadata: { bookId, pageNumber: dto.pageNumber },
          },
        )
      }

      // Check if page number exceeds book's total pages
      if (dto.pageNumber > book.totalPages) {
        throw ErrorFactory.validationError(
          {
            pageNumber: [
              `Page number ${dto.pageNumber} exceeds book's total pages (${book.totalPages})`,
            ],
          },
          { source: 'CreateVoucherBookPageCommandHandler.execute' },
        )
      }

      // Create the page
      const page = await this.pageRepository.createPage(bookId, dto)

      logger.info('VoucherBookPage created', {
        pageId: page.id,
        bookId,
        pageNumber: dto.pageNumber,
      })

      return page
    } catch (error) {
      if (error instanceof ErrorFactory) {
        throw error
      }

      throw ErrorFactory.fromError(
        'Failed to create voucher book page',
        error,
        {
          source: 'CreateVoucherBookPageCommandHandler.execute',
          metadata: { bookId, pageNumber: dto.pageNumber },
        },
      )
    }
  }
}
