import { AdPlacementUpdateDTO } from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
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

export class UpdateAdPlacementCommandHandler {
  private readonly pageLayoutEngine: PageLayoutEngine

  constructor(
    private readonly adPlacementRepository: AdPlacementWriteRepositoryPort,
    private readonly pageRepository: VoucherBookPageWriteRepositoryPort,
    private readonly bookRepository: PDFWriteRepositoryPort,
  ) {
    this.pageLayoutEngine = new PageLayoutEngine()
  }

  async execute(
    placementId: string,
    dto: AdPlacementUpdateDTO,
    context: UserContext,
  ): Promise<any> {
    try {
      // Validate that the placement exists
      const placement = await this.adPlacementRepository.findById(placementId)

      if (!placement) {
        throw ErrorFactory.resourceNotFound('AdPlacement', placementId, {
          source: 'UpdateAdPlacementCommandHandler.execute',
        })
      }

      // Get the page and book
      const page = await this.pageRepository.findById(placement.pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound(
          'VoucherBookPage',
          placement.pageId,
          {
            source: 'UpdateAdPlacementCommandHandler.execute',
          },
        )
      }

      const book = await this.bookRepository.findVoucherBookById(page.bookId)

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', page.bookId, {
          source: 'UpdateAdPlacementCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can update ad placements
      if (!RequestContext.isAdmin(context)) {
        const bookData = book.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to update ad placements for this voucher book',
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
          { status: ['Only ad placements in draft books can be updated'] },
          { source: 'UpdateAdPlacementCommandHandler.execute' },
        )
      }

      // If position or size is changing, validate the new placement
      if (dto.position !== undefined || dto.size !== undefined) {
        const newPosition = dto.position ?? placement.position
        const newSize = dto.size ?? placement.size

        // Get all placements except the current one
        const existingPlacements =
          await this.adPlacementRepository.findByPageId(placement.pageId)
        const occupiedSpaces = new Set<number>()

        for (const p of existingPlacements) {
          if (p.id !== placementId) {
            for (let i = 0; i < p.spacesUsed; i++) {
              occupiedSpaces.add(p.position + i)
            }
          }
        }

        // Validate new position
        if (
          !this.pageLayoutEngine.canPlaceAd(
            occupiedSpaces,
            newPosition,
            newSize,
          )
        ) {
          throw ErrorFactory.validationError(
            {
              position: [
                `Cannot place ${newSize} ad at position ${newPosition}`,
              ],
            },
            {
              source: 'UpdateAdPlacementCommandHandler.execute',
              metadata: {
                occupiedSpaces: Array.from(occupiedSpaces),
                requestedSize: newSize,
                requestedPosition: newPosition,
              },
            },
          )
        }
      }

      // Update the placement
      const updatedPlacement = await this.adPlacementRepository.updatePlacement(
        placementId,
        dto,
      )

      logger.info('Ad placement updated', { placementId })

      return updatedPlacement
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }

      throw ErrorFactory.fromError('Failed to update ad placement', error, {
        source: 'UpdateAdPlacementCommandHandler.execute',
        metadata: { placementId },
      })
    }
  }
}
