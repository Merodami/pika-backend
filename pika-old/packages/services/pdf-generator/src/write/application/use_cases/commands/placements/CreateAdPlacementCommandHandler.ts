import { AdPlacementCreateDTO } from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { AdPlacementWriteRepositoryPort } from '@pdf-write/domain/port/AdPlacementWriteRepositoryPort.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { PageLayoutEngine } from '@pdf-write/infrastructure/services/PageLayoutEngine.js'
import { RequestContext, type UserContext } from '@pika/http'
import {
  BaseError,
  ErrorFactory,
  logger,
  NotAuthorizedError,
} from '@pika/shared'

export class CreateAdPlacementCommandHandler {
  private readonly pageLayoutEngine: PageLayoutEngine

  constructor(
    private readonly adPlacementRepository: AdPlacementWriteRepositoryPort,
    private readonly pageRepository: VoucherBookPageWriteRepositoryPort,
    private readonly bookRepository: PDFWriteRepositoryPort,
  ) {
    this.pageLayoutEngine = new PageLayoutEngine()
  }

  async execute(dto: AdPlacementCreateDTO, context: UserContext): Promise<any> {
    try {
      // Validate that the page exists
      const page = await this.pageRepository.findById(dto.pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound('VoucherBookPage', dto.pageId, {
          source: 'CreateAdPlacementCommandHandler.execute',
        })
      }

      // Check if book is in a valid state
      const book = await this.bookRepository.findVoucherBookById(page.bookId)

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', page.bookId, {
          source: 'CreateAdPlacementCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can create ad placements
      if (!RequestContext.isAdmin(context)) {
        const bookData = book.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to create ad placements for this voucher book',
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
          { status: ['Only draft books can have ad placements added'] },
          { source: 'CreateAdPlacementCommandHandler.execute' },
        )
      }

      // Get existing placements and build occupied spaces
      const existingPlacements = await this.adPlacementRepository.findByPageId(
        dto.pageId,
      )
      const occupiedSpaces = new Set<number>()

      for (const placement of existingPlacements) {
        for (let i = 0; i < placement.spacesUsed; i++) {
          occupiedSpaces.add(placement.position + i)
        }
      }

      // Validate placement can fit
      if (
        !this.pageLayoutEngine.canPlaceAd(
          occupiedSpaces,
          dto.position,
          dto.size,
        )
      ) {
        throw ErrorFactory.resourceConflict(
          'AdPlacement',
          `Cannot place ${dto.size} ad at position ${dto.position} - space is occupied or invalid`,
          {
            source: 'CreateAdPlacementCommandHandler.execute',
            metadata: {
              occupiedSpaces: Array.from(occupiedSpaces),
              requestedSize: dto.size,
              requestedPosition: dto.position,
            },
          },
        )
      }

      // Create the ad placement
      const placement = await this.adPlacementRepository.createPlacement(dto)

      logger.info('Ad placement created', {
        placementId: placement.id,
        pageId: dto.pageId,
        position: dto.position,
        size: dto.size,
      })

      return placement
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }

      throw ErrorFactory.fromError('Failed to create ad placement', error, {
        source: 'CreateAdPlacementCommandHandler.execute',
        metadata: { pageId: dto.pageId, position: dto.position },
      })
    }
  }
}
