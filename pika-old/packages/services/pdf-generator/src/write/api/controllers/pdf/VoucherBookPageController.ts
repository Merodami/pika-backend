import { CreateVoucherBookPageCommandHandler } from '@pdf-write/application/use_cases/commands/pages/CreateVoucherBookPageCommandHandler.js'
import { DeleteVoucherBookPageCommandHandler } from '@pdf-write/application/use_cases/commands/pages/DeleteVoucherBookPageCommandHandler.js'
import { UpdateVoucherBookPageCommandHandler } from '@pdf-write/application/use_cases/commands/pages/UpdateVoucherBookPageCommandHandler.js'
import {
  VoucherBookPageCreateDTO,
  VoucherBookPageUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { RequestContext } from '@pika/http'
import { VoucherBookPageMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class VoucherBookPageController {
  constructor(
    private readonly createPageHandler: CreateVoucherBookPageCommandHandler,
    private readonly updatePageHandler: UpdateVoucherBookPageCommandHandler,
    private readonly deletePageHandler: DeleteVoucherBookPageCommandHandler,
  ) {}

  async createPage(
    request: FastifyRequest<{
      Params: { book_id: string }
      Body: VoucherBookPageCreateDTO
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { book_id } = request.params
      const dto = request.body
      const context = RequestContext.fromHeaders(request)

      const page = await this.createPageHandler.execute(book_id, dto, context)
      const pageDTO = VoucherBookPageMapper.toDTO(page)

      reply.status(201).send(pageDTO)
    } catch (error) {
      if (error instanceof ErrorFactory) {
        throw error
      }
      throw ErrorFactory.fromError('Failed to create page', error, {
        source: 'VoucherBookPageController.createPage',
      })
    }
  }

  async updatePage(
    request: FastifyRequest<{
      Params: { book_id: string; page_id: string }
      Body: VoucherBookPageUpdateDTO
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { page_id } = request.params
      const dto = request.body
      const context = RequestContext.fromHeaders(request)

      const page = await this.updatePageHandler.execute(page_id, dto, context)
      const pageDTO = VoucherBookPageMapper.toDTO(page)

      reply.send(pageDTO)
    } catch (error) {
      if (error instanceof ErrorFactory) {
        throw error
      }
      throw ErrorFactory.fromError('Failed to update page', error, {
        source: 'VoucherBookPageController.updatePage',
      })
    }
  }

  async deletePage(
    request: FastifyRequest<{
      Params: { book_id: string; page_id: string }
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { page_id } = request.params
      const context = RequestContext.fromHeaders(request)

      await this.deletePageHandler.execute(page_id, context)

      reply.status(204).send()
    } catch (error) {
      if (error instanceof ErrorFactory) {
        throw error
      }
      throw ErrorFactory.fromError('Failed to delete page', error, {
        source: 'VoucherBookPageController.deletePage',
      })
    }
  }
}
