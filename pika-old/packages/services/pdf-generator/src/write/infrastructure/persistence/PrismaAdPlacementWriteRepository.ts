import {
  AdPlacementCreateDTO,
  AdPlacementUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { AdPlacementWriteRepositoryPort } from '@pdf-write/domain/port/AdPlacementWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { AdPlacement, PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { get, unset } from 'lodash-es'

export class PrismaAdPlacementWriteRepository
  implements AdPlacementWriteRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  async createPlacement(dto: AdPlacementCreateDTO): Promise<AdPlacement> {
    try {
      // Calculate spaces used based on size
      const spacesUsed = this.getSpacesUsed(dto.size)

      const placement = await this.prisma.adPlacement.create({
        data: {
          id: randomUUID(),
          pageId: dto.pageId,
          position: dto.position,
          size: dto.size,
          spacesUsed,
          contentType: dto.contentType,
          voucherId: dto.voucherId,
          providerId: dto.providerId,
          imageUrl: dto.imageUrl,
          qrCodePayload: dto.qrCodePayload,
          shortCode: dto.shortCode,
          title: dto.title,
          description: dto.description,
          metadata: dto.metadata || {},
        },
      })

      logger.info('AdPlacement created', {
        placementId: placement.id,
        pageId: dto.pageId,
        position: dto.position,
        size: dto.size,
      })

      return placement
    } catch (error) {
      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'AdPlacement',
          `Position ${dto.position} is already occupied on this page`,
          {
            source: 'PrismaAdPlacementWriteRepository.createPlacement',
            metadata: { pageId: dto.pageId, position: dto.position },
          },
        )
      }

      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to create ad placement',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.createPlacement',
          metadata: { pageId: dto.pageId },
        },
      )
    }
  }

  async updatePlacement(
    placementId: string,
    dto: AdPlacementUpdateDTO,
  ): Promise<AdPlacement> {
    try {
      const updateData: any = {
        position: dto.position,
        size: dto.size,
        contentType: dto.contentType,
        voucherId: dto.voucherId,
        providerId: dto.providerId,
        imageUrl: dto.imageUrl,
        qrCodePayload: dto.qrCodePayload,
        shortCode: dto.shortCode,
        title: dto.title,
        description: dto.description,
        metadata: dto.metadata,
      }

      // If size is being updated, recalculate spaces used
      if (dto.size) {
        updateData.spacesUsed = this.getSpacesUsed(dto.size)
      }

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (get(updateData, key) === undefined) {
          unset(updateData, key)
        }
      })

      const placement = await this.prisma.adPlacement.update({
        where: { id: placementId },
        data: updateData,
      })

      logger.info('AdPlacement updated', { placementId })

      return placement
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('AdPlacement', placementId, {
          source: 'PrismaAdPlacementWriteRepository.updatePlacement',
        })
      }

      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'AdPlacement',
          'The new position is already occupied',
          {
            source: 'PrismaAdPlacementWriteRepository.updatePlacement',
            metadata: { placementId },
          },
        )
      }

      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to update ad placement',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.updatePlacement',
          metadata: { placementId },
        },
      )
    }
  }

  async deletePlacement(placementId: string): Promise<void> {
    try {
      await this.prisma.adPlacement.delete({
        where: { id: placementId },
      })

      logger.info('AdPlacement deleted', { placementId })
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('AdPlacement', placementId, {
          source: 'PrismaAdPlacementWriteRepository.deletePlacement',
        })
      }

      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to delete ad placement',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.deletePlacement',
          metadata: { placementId },
        },
      )
    }
  }

  async findById(placementId: string): Promise<AdPlacement | null> {
    try {
      return await this.prisma.adPlacement.findUnique({
        where: { id: placementId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to find ad placement by ID',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.findById',
          metadata: { placementId },
        },
      )
    }
  }

  async findByPageId(pageId: string): Promise<AdPlacement[]> {
    try {
      return await this.prisma.adPlacement.findMany({
        where: { pageId },
        orderBy: { position: 'asc' },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to find ad placements by page ID',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.findByPageId',
          metadata: { pageId },
        },
      )
    }
  }

  async findByVoucherId(voucherId: string): Promise<AdPlacement[]> {
    try {
      return await this.prisma.adPlacement.findMany({
        where: { voucherId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to find ad placements by voucher ID',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.findByVoucherId',
          metadata: { voucherId },
        },
      )
    }
  }

  async findByProviderId(providerId: string): Promise<AdPlacement[]> {
    try {
      return await this.prisma.adPlacement.findMany({
        where: { providerId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to find ad placements by provider ID',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.findByProviderId',
          metadata: { providerId },
        },
      )
    }
  }

  async countOccupiedSpaces(pageId: string): Promise<number> {
    try {
      const placements = await this.prisma.adPlacement.findMany({
        where: { pageId },
        select: { spacesUsed: true },
      })

      return placements.reduce(
        (total: number, placement: any) => total + placement.spacesUsed,
        0,
      )
    } catch (error) {
      throw ErrorFactory.databaseError(
        'AdPlacement',
        'Failed to count occupied spaces',
        error,
        {
          source: 'PrismaAdPlacementWriteRepository.countOccupiedSpaces',
          metadata: { pageId },
        },
      )
    }
  }

  private getSpacesUsed(size: string): number {
    const sizeMap: Record<string, number> = {
      SINGLE: 1,
      QUARTER: 2,
      HALF: 4,
      FULL: 8,
    }

    return get(sizeMap, size, 1)
  }
}
