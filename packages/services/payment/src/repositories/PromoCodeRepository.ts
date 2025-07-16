import type { PrismaClient } from '@prisma/client'
import type { ICacheService } from '@pika/redis'
import type {
  CreatePromoCodeDTO,
  PromoCodeDomain,
  PromoCodeUsageDomain,
  UpdatePromoCodeDTO,
} from '@pika
import { PromoCodeMapper, PromoCodeUsageMapper } from '@pika
import { ErrorFactory } from '@pika

export interface IPromoCodeRepository {
  findAll(): Promise<PromoCodeDomain[]>
  findAllActive(): Promise<PromoCodeDomain[]>
  findById(id: string): Promise<PromoCodeDomain | null>
  findByCode(code: string): Promise<PromoCodeDomain | null>
  create(data: CreatePromoCodeDTO): Promise<PromoCodeDomain>
  update(id: string, data: UpdatePromoCodeDTO): Promise<PromoCodeDomain>
  delete(id: string): Promise<void>
  cancel(id: string): Promise<PromoCodeDomain>
  usePromoCode(
    code: string,
    userId: string,
    transactionId?: string,
  ): Promise<{ promoCode: PromoCodeDomain; usage: PromoCodeUsageDomain }>
  isCodeValidForUser(
    code: string,
    userId: string,
  ): Promise<{ valid: boolean; reason?: string }>
  getUsagesByPromoCodeId(promoCodeId: string): Promise<PromoCodeUsageDomain[]>
  getUsagesByUserId(userId: string): Promise<PromoCodeUsageDomain[]>
}

export class PromoCodeRepository implements IPromoCodeRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(): Promise<PromoCodeDomain[]> {
    try {
      const promoCodes = await this.prisma.promoCode.findMany({
        orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      })

      return promoCodes.map(PromoCodeMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findAll',
        'Failed to find all promo codes',
        error,
      )
    }
  }

  async findAllActive(): Promise<PromoCodeDomain[]> {
    try {
      const now = new Date()
      const promoCodes = await this.prisma.promoCode.findMany({
        where: {
          active: true,
          expirationDate: { gt: now },
          amountAvailable: { gt: 0 },
          cancelledAt: null,
        },
        orderBy: { createdAt: 'desc' },
      })

      return promoCodes.map(PromoCodeMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findAllActive',
        'Failed to find active promo codes',
        error,
      )
    }
  }

  async findById(id: string): Promise<PromoCodeDomain | null> {
    try {
      const promoCode = await this.prisma.promoCode.findUnique({
        where: { id },
      })

      if (!promoCode) return null

      return PromoCodeMapper.fromDocument(promoCode)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to find promo code by ID',
        error,
      )
    }
  }

  async findByCode(code: string): Promise<PromoCodeDomain | null> {
    try {
      const promoCode = await this.prisma.promoCode.findUnique({
        where: { code },
      })

      if (!promoCode) return null

      return PromoCodeMapper.fromDocument(promoCode)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByCode',
        'Failed to find promo code by code',
        error,
      )
    }
  }

  async create(data: CreatePromoCodeDTO): Promise<PromoCodeDomain> {
    try {
      const promoCode = await this.prisma.promoCode.create({
        data: {
          code: data.code,
          discount: data.discount,
          active: data.active ?? true,
          allowedTimes: data.allowedTimes,
          amountAvailable: data.amountAvailable,
          expirationDate: new Date(data.expirationDate),
          createdBy: data.createdBy,
        },
      })

      return PromoCodeMapper.fromDocument(promoCode)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create promo code',
        error,
      )
    }
  }

  async update(id: string, data: UpdatePromoCodeDTO): Promise<PromoCodeDomain> {
    try {
      const updateData: any = {}

      if (data.code !== undefined) updateData.code = data.code
      if (data.discount !== undefined) updateData.discount = data.discount
      if (data.active !== undefined) updateData.active = data.active
      if (data.allowedTimes !== undefined)
        updateData.allowedTimes = data.allowedTimes
      if (data.amountAvailable !== undefined)
        updateData.amountAvailable = data.amountAvailable
      if (data.expirationDate !== undefined)
        updateData.expirationDate = new Date(data.expirationDate)

      const promoCode = await this.prisma.promoCode.update({
        where: { id },
        data: updateData,
      })

      return PromoCodeMapper.fromDocument(promoCode)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update promo code',
        error,
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.promoCode.delete({
        where: { id },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete promo code',
        error,
      )
    }
  }

  async cancel(id: string): Promise<PromoCodeDomain> {
    try {
      const promoCode = await this.prisma.promoCode.update({
        where: { id },
        data: {
          active: false,
          cancelledAt: new Date(),
        },
      })

      return PromoCodeMapper.fromDocument(promoCode)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'cancel',
        'Failed to cancel promo code',
        error,
      )
    }
  }

  async usePromoCode(
    code: string,
    userId: string,
    transactionId?: string,
  ): Promise<{ promoCode: PromoCodeDomain; usage: PromoCodeUsageDomain }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const promoCode = await tx.promoCode.findUnique({
          where: { code },
        })

        if (!promoCode) {
          throw ErrorFactory.resourceNotFound('PromoCode', code)
        }

        const validation = await this.validatePromoCode(promoCode, userId, tx)

        if (!validation.valid) {
          throw ErrorFactory.businessRuleViolation(
            'Invalid promo code',
            validation.reason!,
          )
        }

        const updatedPromoCode = await tx.promoCode.update({
          where: { id: promoCode.id },
          data: {
            amountAvailable: promoCode.amountAvailable - 1,
          },
        })

        const usage = await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoCode.id,
            userId,
            transactionId,
          },
        })

        return {
          promoCode: PromoCodeMapper.fromDocument(updatedPromoCode),
          usage: PromoCodeUsageMapper.fromDocument(usage),
        }
      })
    } catch (error) {
      if (error instanceof ErrorFactory) throw error
      throw ErrorFactory.databaseError(
        'usePromoCode',
        'Failed to use promo code',
        error,
      )
    }
  }

  async isCodeValidForUser(
    code: string,
    userId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const promoCode = await this.prisma.promoCode.findUnique({
        where: { code },
      })

      if (!promoCode) {
        return { valid: false, reason: 'Promo code not found' }
      }

      return await this.validatePromoCode(promoCode, userId)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'isCodeValidForUser',
        'Failed to validate promo code',
        error,
      )
    }
  }

  async getUsagesByPromoCodeId(
    promoCodeId: string,
  ): Promise<PromoCodeUsageDomain[]> {
    try {
      const usages = await this.prisma.promoCodeUsage.findMany({
        where: { promoCodeId },
        orderBy: { usedAt: 'desc' },
      })

      return usages.map(PromoCodeUsageMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getUsagesByPromoCodeId',
        'Failed to get usages by promo code ID',
        error,
      )
    }
  }

  async getUsagesByUserId(userId: string): Promise<PromoCodeUsageDomain[]> {
    try {
      const usages = await this.prisma.promoCodeUsage.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
      })

      return usages.map(PromoCodeUsageMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getUsagesByUserId',
        'Failed to get usages by user ID',
        error,
      )
    }
  }

  private async validatePromoCode(
    promoCode: any,
    userId: string,
    tx?: any,
  ): Promise<{ valid: boolean; reason?: string }> {
    const prismaClient = tx || this.prisma
    const now = new Date()

    if (!promoCode.active) {
      return { valid: false, reason: 'Promo code is not active' }
    }

    if (promoCode.cancelledAt) {
      return { valid: false, reason: 'Promo code has been cancelled' }
    }

    if (promoCode.expirationDate <= now) {
      return { valid: false, reason: 'Promo code has expired' }
    }

    if (promoCode.amountAvailable <= 0) {
      return { valid: false, reason: 'Promo code has no remaining uses' }
    }

    const existingUsage = await prismaClient.promoCodeUsage.findFirst({
      where: {
        promoCodeId: promoCode.id,
        userId,
      },
    })

    if (existingUsage) {
      return { valid: false, reason: 'You have already used this promo code' }
    }

    return { valid: true }
  }
}
