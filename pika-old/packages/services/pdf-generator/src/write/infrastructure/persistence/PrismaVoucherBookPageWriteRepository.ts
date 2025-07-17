import {
  VoucherBookPageCreateDTO,
  VoucherBookPageUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookPageDTO.js'
import { VoucherBookPageWriteRepositoryPort } from '@pdf-write/domain/port/VoucherBookPageWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { PrismaClient, VoucherBookPage } from '@prisma/client'
import { randomUUID } from 'crypto'

export class PrismaVoucherBookPageWriteRepository
  implements VoucherBookPageWriteRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  async createPage(
    bookId: string,
    dto: VoucherBookPageCreateDTO,
  ): Promise<VoucherBookPage> {
    try {
      const page = await this.prisma.voucherBookPage.create({
        data: {
          id: randomUUID(),
          bookId,
          pageNumber: dto.pageNumber,
          layoutType: dto.layoutType || 'STANDARD',
          metadata: dto.metadata || {},
        },
      })

      logger.info('VoucherBookPage created', {
        pageId: page.id,
        bookId,
        pageNumber: dto.pageNumber,
      })

      return page
    } catch (error) {
      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'VoucherBookPage',
          `Page ${dto.pageNumber} already exists for this book`,
          {
            source: 'PrismaVoucherBookPageWriteRepository.createPage',
            metadata: { bookId, pageNumber: dto.pageNumber },
          },
        )
      }

      throw ErrorFactory.databaseError(
        'VoucherBookPage',
        'Failed to create page',
        error,
        {
          source: 'PrismaVoucherBookPageWriteRepository.createPage',
          metadata: { bookId },
        },
      )
    }
  }

  async updatePage(
    pageId: string,
    dto: VoucherBookPageUpdateDTO,
  ): Promise<VoucherBookPage> {
    try {
      const page = await this.prisma.voucherBookPage.update({
        where: { id: pageId },
        data: {
          layoutType: dto.layoutType,
          metadata: dto.metadata,
        },
      })

      logger.info('VoucherBookPage updated', { pageId })

      return page
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('VoucherBookPage', pageId, {
          source: 'PrismaVoucherBookPageWriteRepository.updatePage',
        })
      }

      throw ErrorFactory.databaseError(
        'VoucherBookPage',
        'Failed to update page',
        error,
        {
          source: 'PrismaVoucherBookPageWriteRepository.updatePage',
          metadata: { pageId },
        },
      )
    }
  }

  async deletePage(pageId: string): Promise<void> {
    try {
      await this.prisma.voucherBookPage.delete({
        where: { id: pageId },
      })

      logger.info('VoucherBookPage deleted', { pageId })
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('VoucherBookPage', pageId, {
          source: 'PrismaVoucherBookPageWriteRepository.deletePage',
        })
      }

      throw ErrorFactory.databaseError(
        'VoucherBookPage',
        'Failed to delete page',
        error,
        {
          source: 'PrismaVoucherBookPageWriteRepository.deletePage',
          metadata: { pageId },
        },
      )
    }
  }

  async findById(pageId: string): Promise<VoucherBookPage | null> {
    try {
      return await this.prisma.voucherBookPage.findUnique({
        where: { id: pageId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'VoucherBookPage',
        'Failed to find page by ID',
        error,
        {
          source: 'PrismaVoucherBookPageWriteRepository.findById',
          metadata: { pageId },
        },
      )
    }
  }

  async findByBookId(bookId: string): Promise<VoucherBookPage[]> {
    try {
      return await this.prisma.voucherBookPage.findMany({
        where: { bookId },
        orderBy: { pageNumber: 'asc' },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'VoucherBookPage',
        'Failed to find pages by book ID',
        error,
        {
          source: 'PrismaVoucherBookPageWriteRepository.findByBookId',
          metadata: { bookId },
        },
      )
    }
  }

  async findByBookIdAndPageNumber(
    bookId: string,
    pageNumber: number,
  ): Promise<VoucherBookPage | null> {
    try {
      return await this.prisma.voucherBookPage.findUnique({
        where: {
          bookId_pageNumber: { bookId, pageNumber },
        },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'VoucherBookPage',
        'Failed to find page by book ID and page number',
        error,
        {
          source:
            'PrismaVoucherBookPageWriteRepository.findByBookIdAndPageNumber',
          metadata: { bookId, pageNumber },
        },
      )
    }
  }
}
