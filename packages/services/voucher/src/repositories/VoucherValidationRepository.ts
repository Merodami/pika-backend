/**
 * VoucherValidationRepository
 *
 * Handles database operations for URL-based voucher validation codes.
 * This repository is separated from the main VoucherRepository to isolate
 * validation-specific data access logic.
 */

import { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { type VoucherValidationCodeTypeType } from '@pika/types'
import type { PrismaClient, VoucherValidationCode } from '@prisma/client'

import type {
  CreateValidationCodeData,
  ValidationCodeRecord,
} from '../types/validation.js'

export interface IVoucherValidationRepository {
  createValidationCode(data: CreateValidationCodeData): Promise<void>
  findValidationCode(code: string): Promise<ValidationCodeRecord | null>
  findValidationCodeByVoucherId(
    voucherId: string,
  ): Promise<ValidationCodeRecord[]>
  markValidationCodeUsed(code: string, userId: string): Promise<void>
  deleteExpiredValidationCodes(): Promise<number>
  deleteValidationCode(code: string): Promise<void>
  getActiveValidationCodesCount(voucherId: string): Promise<number>
}

export class VoucherValidationRepository
  implements IVoucherValidationRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Create a new validation code
   */
  async createValidationCode(data: CreateValidationCodeData): Promise<void> {
    try {
      await this.prisma.voucherValidationCode.create({
        data: {
          voucherId: data.voucherId,
          code: data.code,
          type: data.type as any, // Prisma expects its own enum type
          expiresAt: data.expiresAt,
          metadata: data.metadata || {},
        },
      })

      logger.info('Created validation code', {
        voucherId: data.voucherId,
        code: data.code,
        type: data.type,
        expiresAt: data.expiresAt,
      })
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === 'P2002') {
        logger.error('Validation code already exists', {
          code: data.code,
          error,
        })
        throw ErrorFactory.uniqueConstraintViolation(
          'ValidationCode',
          'code',
          data.code,
        )
      }

      logger.error('Failed to create validation code', {
        error,
        data,
      })
      throw ErrorFactory.fromError(error, 'Failed to create validation code')
    }
  }

  /**
   * Find a validation code by code string
   */
  async findValidationCode(code: string): Promise<ValidationCodeRecord | null> {
    try {
      const validationCode = await this.prisma.voucherValidationCode.findUnique(
        {
          where: { code },
        },
      )

      if (!validationCode) {
        return null
      }

      return this.mapToValidationCodeRecord(validationCode)
    } catch (error) {
      logger.error('Failed to find validation code', {
        error,
        code,
      })
      throw ErrorFactory.fromError(error, 'Failed to find validation code')
    }
  }

  /**
   * Find all validation codes for a voucher
   */
  async findValidationCodeByVoucherId(
    voucherId: string,
  ): Promise<ValidationCodeRecord[]> {
    try {
      const codes = await this.prisma.voucherValidationCode.findMany({
        where: {
          voucherId,
          expiresAt: {
            gt: new Date(),
          },
          usedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return codes.map(this.mapToValidationCodeRecord)
    } catch (error) {
      logger.error('Failed to find validation codes by voucher ID', {
        error,
        voucherId,
      })
      throw ErrorFactory.fromError(error, 'Failed to find validation codes')
    }
  }

  /**
   * Mark a validation code as used
   */
  async markValidationCodeUsed(code: string, userId: string): Promise<void> {
    try {
      const updated = await this.prisma.voucherValidationCode.update({
        where: { code },
        data: {
          usedAt: new Date(),
          usedBy: userId,
        },
      })

      logger.info('Marked validation code as used', {
        code,
        userId,
        voucherId: updated.voucherId,
      })
    } catch (error) {
      logger.error('Failed to mark validation code as used', {
        error,
        code,
        userId,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to mark validation code as used',
      )
    }
  }

  /**
   * Delete expired validation codes
   */
  async deleteExpiredValidationCodes(): Promise<number> {
    try {
      const result = await this.prisma.voucherValidationCode.deleteMany({
        where: {
          OR: [
            {
              expiresAt: {
                lt: new Date(),
              },
            },
            {
              usedAt: {
                not: null,
              },
              createdAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
              },
            },
          ],
        },
      })

      logger.info('Deleted expired validation codes', {
        count: result.count,
      })

      return result.count
    } catch (error) {
      logger.error('Failed to delete expired validation codes', {
        error,
      })
      throw ErrorFactory.fromError(error, 'Failed to delete expired codes')
    }
  }

  /**
   * Delete a specific validation code
   */
  async deleteValidationCode(code: string): Promise<void> {
    try {
      await this.prisma.voucherValidationCode.delete({
        where: { code },
      })

      logger.info('Deleted validation code', {
        code,
      })
    } catch (error) {
      logger.error('Failed to delete validation code', {
        error,
        code,
      })
      throw ErrorFactory.fromError(error, 'Failed to delete validation code')
    }
  }

  /**
   * Get count of active validation codes for a voucher
   */
  async getActiveValidationCodesCount(voucherId: string): Promise<number> {
    try {
      const count = await this.prisma.voucherValidationCode.count({
        where: {
          voucherId,
          expiresAt: {
            gt: new Date(),
          },
          usedAt: null,
        },
      })

      return count
    } catch (error) {
      logger.error('Failed to get active validation codes count', {
        error,
        voucherId,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to get validation codes count',
      )
    }
  }

  /**
   * Map Prisma VoucherValidationCode to ValidationCodeRecord
   */
  private mapToValidationCodeRecord(
    code: VoucherValidationCode,
  ): ValidationCodeRecord {
    return {
      id: code.id,
      voucherId: code.voucherId,
      code: code.code,
      type: code.type as VoucherValidationCodeTypeType,
      expiresAt: code.expiresAt,
      usedAt: code.usedAt,
      usedBy: code.usedBy,
      createdAt: code.createdAt,
      metadata: code.metadata as Record<string, any>,
    }
  }
}
