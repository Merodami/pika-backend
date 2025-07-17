import { CreateAdPlacementCommandHandler } from '@pdf-write/application/use_cases/commands/placements/CreateAdPlacementCommandHandler.js'
import { DeleteAdPlacementCommandHandler } from '@pdf-write/application/use_cases/commands/placements/DeleteAdPlacementCommandHandler.js'
import { UpdateAdPlacementCommandHandler } from '@pdf-write/application/use_cases/commands/placements/UpdateAdPlacementCommandHandler.js'
import {
  AdPlacementCreateDTO,
  AdPlacementUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { RequestContext } from '@pika/http'
import { AdPlacementMapper } from '@pika/sdk'
import { BaseError, ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class AdPlacementController {
  constructor(
    private readonly createPlacementHandler: CreateAdPlacementCommandHandler,
    private readonly updatePlacementHandler: UpdateAdPlacementCommandHandler,
    private readonly deletePlacementHandler: DeleteAdPlacementCommandHandler,
  ) {}

  async createPlacement(
    request: FastifyRequest<{
      Params: { book_id: string; page_id: string }
      Body: Omit<AdPlacementCreateDTO, 'pageId'>
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { page_id } = request.params
      const dto: AdPlacementCreateDTO = {
        ...request.body,
        pageId: page_id,
      }
      const context = RequestContext.fromHeaders(request)

      const placement = await this.createPlacementHandler.execute(dto, context)
      const placementDTO = AdPlacementMapper.toDTO(placement)

      reply.status(201).send(placementDTO)
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }
      throw ErrorFactory.fromError('Failed to create ad placement', error, {
        source: 'AdPlacementController.createPlacement',
      })
    }
  }

  async updatePlacement(
    request: FastifyRequest<{
      Params: { book_id: string; page_id: string; placement_id: string }
      Body: AdPlacementUpdateDTO
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { placement_id } = request.params
      const dto = request.body
      const context = RequestContext.fromHeaders(request)

      const placement = await this.updatePlacementHandler.execute(
        placement_id,
        dto,
        context,
      )
      const placementDTO = AdPlacementMapper.toDTO(placement)

      reply.send(placementDTO)
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }
      throw ErrorFactory.fromError('Failed to update ad placement', error, {
        source: 'AdPlacementController.updatePlacement',
      })
    }
  }

  async deletePlacement(
    request: FastifyRequest<{
      Params: { book_id: string; page_id: string; placement_id: string }
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { placement_id } = request.params
      const context = RequestContext.fromHeaders(request)

      await this.deletePlacementHandler.execute(placement_id, context)

      reply.status(204).send()
    } catch (error) {
      if (error instanceof BaseError) {
        throw error
      }
      throw ErrorFactory.fromError('Failed to delete ad placement', error, {
        source: 'AdPlacementController.deletePlacement',
      })
    }
  }
}
