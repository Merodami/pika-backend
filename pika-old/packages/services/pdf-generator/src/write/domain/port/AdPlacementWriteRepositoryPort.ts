import {
  AdPlacementCreateDTO,
  AdPlacementUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { AdPlacement } from '@prisma/client'

export interface AdPlacementWriteRepositoryPort {
  createPlacement(dto: AdPlacementCreateDTO): Promise<AdPlacement>
  updatePlacement(
    placementId: string,
    dto: AdPlacementUpdateDTO,
  ): Promise<AdPlacement>
  deletePlacement(placementId: string): Promise<void>
  findById(placementId: string): Promise<AdPlacement | null>
  findByPageId(pageId: string): Promise<AdPlacement[]>
  findByVoucherId(voucherId: string): Promise<AdPlacement[]>
  findByProviderId(providerId: string): Promise<AdPlacement[]>
  countOccupiedSpaces(pageId: string): Promise<number>
}
