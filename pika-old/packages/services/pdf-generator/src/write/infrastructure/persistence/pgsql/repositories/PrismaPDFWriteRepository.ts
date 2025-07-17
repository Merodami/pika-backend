import {
  type VoucherBookCreateDTO,
  type VoucherBookStatusUpdateDTO,
  type VoucherBookUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookDTO.js'
import { VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'
import { type PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { Prisma, type PrismaClient } from '@prisma/client'

import {
  VoucherBookDocumentMapper,
  type VoucherBookWriteDocument,
} from '../mappers/VoucherBookDocumentMapper.js'

/**
 * Prisma implementation of the PDFWriteRepository
 * Handles persistence and data mapping to/from the database
 */
export class PrismaPDFWriteRepository implements PDFWriteRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new voucher book in the database
   */
  async createVoucherBook(dto: VoucherBookCreateDTO): Promise<VoucherBook> {
    const startTime = Date.now()

    try {
      logger.debug('Creating voucher book with dto:', dto)

      // Create domain entity first to validate business rules
      const voucherBook = VoucherBook.create({
        title: dto.title,
        edition: dto.edition ?? null,
        bookType: dto.bookType ?? 'MONTHLY',
        month: dto.month ?? null,
        year: dto.year,
        totalPages: dto.totalPages ?? 24,
        coverImageUrl: dto.coverImageUrl ?? null,
        backImageUrl: null,
        createdBy: dto.createdBy,
        providerId: dto.providerId ?? null,
        status: 'DRAFT',
        generatedAt: null,
        publishedAt: null,
        pdfUrl: null,
      })

      // Map domain entity to database format
      const createData =
        VoucherBookDocumentMapper.mapDomainToCreateData(voucherBook)

      logger.debug('Final createData for Prisma:', createData)

      // Create the voucher book in the database
      const created = await this.prisma.voucherBook.create({
        data: {
          id: voucherBook.id,
          ...createData,
        },
      })

      const duration = Date.now() - startTime

      logger.debug('VoucherBook created in database:', {
        id: created.id,
        title: created.title,
        bookType: created.bookType,
        year: created.year,
        month: created.month,
        dbOperationDuration: duration,
      })

      return VoucherBookDocumentMapper.mapDocumentToDomain(
        created as VoucherBookWriteDocument,
      )
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('Database error during voucher book creation', {
        operation: 'create_voucher_book',
        dbOperationDuration: duration,
        error: error.message,
        errorCode: error.code,
        title: dto.title,
      })

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'title'
          const value = (dto[field as keyof typeof dto] as string) || 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'VoucherBook',
            field,
            typeof value === 'string' ? value : JSON.stringify(value),
            {
              source: 'PrismaPDFWriteRepository.createVoucherBook',
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'create_voucher_book',
        'Failed to create voucher book',
        error,
        {
          source: 'PrismaPDFWriteRepository.createVoucherBook',
          metadata: {
            title: dto.title,
            year: dto.year,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Updates an existing voucher book in the database
   */
  async updateVoucherBook(
    id: string,
    dto: VoucherBookUpdateDTO,
  ): Promise<VoucherBook> {
    try {
      // First get the existing voucher book
      const existing = await this.prisma.voucherBook.findUnique({
        where: { id },
      })

      if (!existing) {
        logger.debug('VoucherBook not found for update:', id)
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'PrismaPDFWriteRepository.updateVoucherBook',
          httpStatus: 404,
        })
      }

      logger.debug('Updating voucher book with dto:', { id, dto })

      // Map to domain entity
      const existingEntity = VoucherBookDocumentMapper.mapDocumentToDomain(
        existing as VoucherBookWriteDocument,
      )

      // Update using domain method
      const updatedEntity = existingEntity.update({
        title: dto.title,
        edition: dto.edition,
        bookType: dto.bookType,
        month: dto.month,
        year: dto.year,
        totalPages: dto.totalPages,
        coverImageUrl: dto.coverImageUrl,
        backImageUrl: dto.backImageUrl,
      })

      // Map back to database format
      const updateData =
        VoucherBookDocumentMapper.mapDomainToUpdateData(updatedEntity)

      // Update the voucher book
      const updated = await this.prisma.voucherBook.update({
        where: { id },
        data: updateData,
      })

      return VoucherBookDocumentMapper.mapDocumentToDomain(
        updated as VoucherBookWriteDocument,
      )
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBook', id, {
            source: 'PrismaPDFWriteRepository.updateVoucherBook',
            httpStatus: 404,
          })
        }

        // Unique constraint violation
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'title'
          const value = (dto[field as keyof typeof dto] as string) || 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'VoucherBook',
            field,
            typeof value === 'string' ? value : JSON.stringify(value),
            {
              source: 'PrismaPDFWriteRepository.updateVoucherBook',
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'update_voucher_book',
        'Failed to update voucher book',
        error,
        {
          source: 'PrismaPDFWriteRepository.updateVoucherBook',
          metadata: {
            bookId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Updates voucher book status
   */
  async updateVoucherBookStatus(
    id: string,
    dto: VoucherBookStatusUpdateDTO,
  ): Promise<VoucherBook> {
    try {
      // First get the existing voucher book
      const existing = await this.prisma.voucherBook.findUnique({
        where: { id },
      })

      if (!existing) {
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'PrismaPDFWriteRepository.updateVoucherBookStatus',
          httpStatus: 404,
        })
      }

      // Map to domain entity
      const existingEntity = VoucherBookDocumentMapper.mapDocumentToDomain(
        existing as VoucherBookWriteDocument,
      )

      // Apply status transition using domain methods
      let updatedEntity: VoucherBook

      switch (dto.status) {
        case 'READY_FOR_PRINT':
          updatedEntity = existingEntity.markAsReadyForPrint()
          if (dto.pdfUrl) {
            updatedEntity = updatedEntity.setGeneratedAt(new Date())
          }
          break

        case 'PUBLISHED':
          if (!dto.pdfUrl) {
            throw ErrorFactory.validationError(
              { pdfUrl: ['PDF URL is required for publishing'] },
              { source: 'PrismaPDFWriteRepository.updateVoucherBookStatus' },
            )
          }
          updatedEntity = existingEntity.publish(dto.pdfUrl)
          break

        case 'ARCHIVED':
          updatedEntity = existingEntity.archive()
          break

        default:
          throw ErrorFactory.validationError(
            { status: [`Invalid status transition to ${dto.status}`] },
            { source: 'PrismaPDFWriteRepository.updateVoucherBookStatus' },
          )
      }

      // Map back to database format
      const updateData =
        VoucherBookDocumentMapper.mapDomainToUpdateData(updatedEntity)

      const updated = await this.prisma.voucherBook.update({
        where: { id },
        data: updateData,
      })

      return VoucherBookDocumentMapper.mapDocumentToDomain(
        updated as VoucherBookWriteDocument,
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBook', id, {
            source: 'PrismaPDFWriteRepository.updateVoucherBookStatus',
            httpStatus: 404,
          })
        }
      }

      throw ErrorFactory.databaseError(
        'update_voucher_book_status',
        'Failed to update voucher book status',
        error,
        {
          source: 'PrismaPDFWriteRepository.updateVoucherBookStatus',
          metadata: { bookId: id, newStatus: dto.status },
        },
      )
    }
  }

  /**
   * Deletes a voucher book from the database
   */
  async deleteVoucherBook(id: string): Promise<void> {
    try {
      // Check if the voucher book exists before attempting to delete
      const exists = await this.prisma.voucherBook.count({ where: { id } })

      if (exists === 0) {
        logger.debug('VoucherBook not found for deletion:', id)
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'PrismaPDFWriteRepository.deleteVoucherBook',
          httpStatus: 404,
        })
      }

      logger.debug('Deleting voucher book from database', { id })

      // Delete the voucher book from the database
      await this.prisma.voucherBook.delete({ where: { id } })

      logger.info('VoucherBook deleted successfully', { id })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBook', id, {
            source: 'PrismaPDFWriteRepository.deleteVoucherBook',
          })
        }

        // Foreign key constraint failure (has dependent records)
        if (error.code === 'P2003') {
          throw ErrorFactory.businessRuleViolation(
            'VoucherBook has dependent entities',
            'Cannot delete voucher book with pages or ad placements',
            {
              source: 'PrismaPDFWriteRepository.deleteVoucherBook',
              suggestion: 'Remove all pages and ad placements first',
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'delete_voucher_book',
        'Failed to delete voucher book',
        error,
        {
          source: 'PrismaPDFWriteRepository.deleteVoucherBook',
          metadata: {
            bookId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Finds a voucher book by ID
   */
  async findVoucherBookById(id: string): Promise<VoucherBook | null> {
    try {
      const record = await this.prisma.voucherBook.findUnique({
        where: { id },
      })

      if (!record) {
        return null
      }

      return VoucherBookDocumentMapper.mapDocumentToDomain(
        record as VoucherBookWriteDocument,
      )
    } catch (error) {
      throw ErrorFactory.databaseError(
        'find_voucher_book_by_id',
        'Failed to find voucher book',
        error,
        {
          source: 'PrismaPDFWriteRepository.findVoucherBookById',
          metadata: { bookId: id },
        },
      )
    }
  }

  /**
   * Gets a voucher book with all its pages and ad placements
   */
  async getVoucherBookWithPages(id: string): Promise<any | null> {
    try {
      const record = await this.prisma.voucherBook.findUnique({
        where: { id },
        include: {
          pages: {
            include: {
              adPlacements: true,
            },
            orderBy: {
              pageNumber: 'asc',
            },
          },
        },
      })

      if (!record) {
        return null
      }

      return record
    } catch (error) {
      throw ErrorFactory.databaseError(
        'get_voucher_book_with_pages',
        'Failed to get voucher book with pages',
        error,
        {
          source: 'PrismaPDFWriteRepository.getVoucherBookWithPages',
          metadata: { bookId: id },
        },
      )
    }
  }
}
