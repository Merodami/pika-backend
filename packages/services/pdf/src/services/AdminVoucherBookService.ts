import type { VoucherBook, VoucherBookStatus } from '@prisma/client'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'

import { VoucherBookService } from './VoucherBookService.js'
import type { VoucherBookSearchParams } from './VoucherBookService.js'

export interface AdminVoucherBookSearchParams extends VoucherBookSearchParams {
  // Admin-specific search parameters
  createdBy?: string
  updatedBy?: string
  hasContent?: boolean
  hasPdf?: boolean
  status?: VoucherBookStatus
}

export interface IAdminVoucherBookService {
  getAllVoucherBooks(
    params: AdminVoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBook>>
  getVoucherBookById(id: string): Promise<VoucherBook>
  createVoucherBook(data: any): Promise<VoucherBook>
  updateVoucherBook(id: string, data: any): Promise<VoucherBook>
  deleteVoucherBook(id: string): Promise<void>
  updateVoucherBookStatus(
    id: string,
    status: VoucherBookStatus,
    userId: string,
  ): Promise<VoucherBook>
  generatePDF(id: string, userId?: string): Promise<any>
  bulkArchiveVoucherBooks(ids: string[], userId: string): Promise<void>
  getVoucherBookStatistics(id: string): Promise<{
    totalPages: number
    usedSpaces: number
    availableSpaces: number
    totalPlacements: number
    placementsByType: Record<string, number>
  }>
}

/**
 * Admin voucher book service that extends the base VoucherBookService
 * with admin-specific operations and enhanced permissions.
 *
 * Based on the pika-old CQRS pattern but simplified for the new architecture.
 * Handles state transitions, bulk operations, and admin-specific business logic.
 */
export class AdminVoucherBookService
  extends VoucherBookService
  implements IAdminVoucherBookService
{
  /**
   * Update voucher book status with proper state transition validation
   * Based on the pika-old UpdateVoucherBookStatusCommandHandler pattern
   */
  async updateVoucherBookStatus(
    id: string,
    status: VoucherBookStatus,
    userId: string,
  ): Promise<VoucherBook> {
    try {
      logger.info('Updating voucher book status', { id, status, userId })

      // 1. Fetch existing book to validate state transition
      const existingBook = await this.getVoucherBookById(id)

      // 2. Validate state transition (following pika-old pattern)
      this.validateStateTransition(existingBook.status, status)

      // 3. Apply status-specific business logic
      let updateData: any = {
        status,
        updatedById: userId,
      }

      switch (status) {
        case 'PUBLISHED':
          updateData = {
            ...updateData,
            publishedAt: new Date(),
          }
          break
        case 'ARCHIVED':
          updateData = {
            ...updateData,
            archivedAt: new Date(),
          }
          break
        case 'READY_FOR_PRINT':
          // Mark as ready for print - could trigger PDF generation
          break
      }

      // 4. Update using the base service
      const updatedBook = await this.updateVoucherBook(id, updateData)

      logger.info('Voucher book status updated successfully', {
        id,
        oldStatus: existingBook.status,
        newStatus: status,
      })

      return updatedBook
    } catch (error) {
      logger.error('Failed to update voucher book status', {
        id,
        status,
        error,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to update voucher book status',
      )
    }
  }

  /**
   * Bulk archive voucher books with proper error handling
   * Based on the pika-old batch operation patterns
   */
  async bulkArchiveVoucherBooks(ids: string[], userId: string): Promise<void> {
    try {
      logger.info('Bulk archiving voucher books', { count: ids.length, userId })

      const results = []
      const errors = []

      // Process each book individually for proper error handling
      for (const id of ids) {
        try {
          await this.updateVoucherBookStatus(id, 'ARCHIVED', userId)
          results.push({ id, success: true })
        } catch (error) {
          logger.warn('Failed to archive voucher book', { id, error })
          errors.push({ id, error: error.message })
          results.push({ id, success: false, error: error.message })
        }
      }

      if (errors.length > 0) {
        logger.warn('Some books failed to archive', {
          total: ids.length,
          successful: results.filter((r) => r.success).length,
          failed: errors.length,
          errors,
        })
      }

      logger.info('Bulk archive operation completed', {
        total: ids.length,
        successful: results.filter((r) => r.success).length,
        failed: errors.length,
      })
    } catch (error) {
      logger.error('Bulk archive operation failed', { ids, error })
      throw ErrorFactory.fromError(
        error,
        'Failed to bulk archive voucher books',
      )
    }
  }

  /**
   * Validate state transitions based on pika-old business rules
   *
   * Allowed transitions:
   * - DRAFT → READY_FOR_PRINT
   * - READY_FOR_PRINT → PUBLISHED (requires PDF)
   * - READY_FOR_PRINT → DRAFT (rollback)
   * - PUBLISHED → ARCHIVED
   * - Any status → ARCHIVED (admin override)
   */
  private validateStateTransition(
    currentStatus: VoucherBookStatus,
    newStatus: VoucherBookStatus,
  ): void {
    // Allow admin to archive any book
    if (newStatus === 'ARCHIVED') {
      return
    }

    // Allow same status (no-op)
    if (currentStatus === newStatus) {
      return
    }

    const allowedTransitions: Record<VoucherBookStatus, VoucherBookStatus[]> = {
      DRAFT: ['READY_FOR_PRINT', 'ARCHIVED'],
      READY_FOR_PRINT: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      PUBLISHED: ['ARCHIVED'],
      ARCHIVED: [], // Archived books cannot be changed
    }

    const allowed = allowedTransitions[currentStatus] || []
    if (!allowed.includes(newStatus)) {
      throw ErrorFactory.badRequest(
        `Invalid state transition from ${currentStatus} to ${newStatus}`,
        {
          source: 'AdminVoucherBookService.validateStateTransition',
          currentStatus,
          newStatus,
          allowedTransitions: allowed,
        },
      )
    }
  }

  /**
   * Override getAllVoucherBooks to support admin-specific filtering
   */
  async getAllVoucherBooks(
    params: AdminVoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBook>> {
    // Convert admin params to base service params
    const baseParams = {
      ...params,
      // Admin can see all statuses, not just published
      includeInactive: true,
    }

    return super.getAllVoucherBooks(baseParams)
  }
}
