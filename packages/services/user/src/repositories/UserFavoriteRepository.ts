import {
  type BusinessDomain,
  BusinessMapper,
  type VoucherDomain,
  VoucherMapper,
} from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import type { Prisma, PrismaClient } from '@prisma/client'

// Domain types for favorites (following the business/category pattern)
export interface FavoriteBusinessDomain {
  id: string
  userId: string
  businessId: string
  createdAt: Date
  business?: BusinessDomain
}

export interface FavoriteVoucherDomain {
  id: string
  userId: string
  voucherId: string
  createdAt: Date
  voucher?: VoucherDomain
}

export interface IUserFavoriteRepository {
  // Business favorites
  addFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<FavoriteBusinessDomain>
  removeFavoriteBusiness(userId: string, businessId: string): Promise<void>
  getFavoriteBusinesses(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'businessName'
      sortOrder?: 'asc' | 'desc'
      parsedIncludes?: ParsedIncludes
    },
  ): Promise<PaginatedResult<FavoriteBusinessDomain>>
  isFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }>
  batchAddFavoriteBusinesses(
    userId: string,
    businessIds: string[],
  ): Promise<{ added: number; errors: any[] }>
  batchRemoveFavoriteBusinesses(
    userId: string,
    businessIds: string[],
  ): Promise<{ removed: number; errors: any[] }>

  // Voucher favorites
  addFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<FavoriteVoucherDomain>
  removeFavoriteVoucher(userId: string, voucherId: string): Promise<void>
  getFavoriteVouchers(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'voucherTitle' | 'expiryDate'
      sortOrder?: 'asc' | 'desc'
      parsedIncludes?: ParsedIncludes
    },
  ): Promise<PaginatedResult<FavoriteVoucherDomain>>
  isFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }>
  batchAddFavoriteVouchers(
    userId: string,
    voucherIds: string[],
  ): Promise<{ added: number; errors: any[] }>
  batchRemoveFavoriteVouchers(
    userId: string,
    voucherIds: string[],
  ): Promise<{ removed: number; errors: any[] }>
}

export class UserFavoriteRepository implements IUserFavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Builds include clause for business favorites based on ParsedIncludes
   */
  private buildBusinessIncludeClause(
    includes?: ParsedIncludes,
  ): Prisma.FavouriteBusinessInclude {
    const include: Prisma.FavouriteBusinessInclude = {}

    if (includes?.business) {
      include.business = {
        include: {
          category: includes.category || includes.businessCategory,
          businessDetails: includes.businessDetails,
        },
      }
    }

    return include
  }

  /**
   * Builds include clause for voucher favorites based on ParsedIncludes
   */
  private buildVoucherIncludeClause(
    includes?: ParsedIncludes,
  ): Prisma.FavouriteVoucherInclude {
    const include: Prisma.FavouriteVoucherInclude = {}

    if (includes?.voucher) {
      include.voucher = {
        include: {
          business: includes.business || includes.voucherBusiness,
          category: includes.category || includes.voucherCategory,
        },
      }
    }

    return include
  }

  // =============== Business Favorites ===============

  async addFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<FavoriteBusinessDomain> {
    try {
      const [favorite] = await this.prisma.$transaction([
        this.prisma.favouriteBusiness.create({
          data: {
            userId,
            businessId,
          },
        }),
        this.prisma.business.update({
          where: { id: businessId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ])

      return {
        id: favorite.id,
        userId: favorite.userId,
        businessId: favorite.businessId,
        createdAt: favorite.createdAt,
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'favorite_business',
          'Business already in favorites',
        )
      }
      if (error.code === 'P2003') {
        throw ErrorFactory.resourceNotFound('business', businessId)
      }
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('business', businessId)
      }
      throw ErrorFactory.databaseError(
        'add favorite business',
        'Failed to add business to favorites',
        error,
      )
    }
  }

  async removeFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.favouriteBusiness.delete({
          where: {
            unique_user_business_favorite: {
              userId,
              businessId,
            },
          },
        }),
        this.prisma.business.update({
          where: { id: businessId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ])
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('favorite_business', businessId)
      }
      throw ErrorFactory.databaseError(
        'remove favorite business',
        'Failed to remove business from favorites',
        error,
      )
    }
  }

  async getFavoriteBusinesses(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'businessName'
      sortOrder?: 'asc' | 'desc'
      parsedIncludes?: ParsedIncludes
    },
  ): Promise<PaginatedResult<FavoriteBusinessDomain>> {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      parsedIncludes,
    } = params
    const skip = (page - 1) * limit

    try {
      const include = this.buildBusinessIncludeClause(parsedIncludes)

      const [data, total] = await Promise.all([
        this.prisma.favouriteBusiness.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy:
            sortBy === 'createdAt' ? { createdAt: sortOrder } : undefined,
          include,
        }),
        this.prisma.favouriteBusiness.count({
          where: { userId },
        }),
      ])

      // Sort by business name if needed (requires post-query sorting)
      let sortedData = data

      if (sortBy === 'businessName' && parsedIncludes?.business) {
        sortedData = [...data].sort((a, b) => {
          const nameA = a.business?.businessNameKey || ''
          const nameB = b.business?.businessNameKey || ''

          return sortOrder === 'asc'
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA)
        })
      }

      // Map to domain entities using BusinessMapper
      const domainFavorites: FavoriteBusinessDomain[] = sortedData.map(
        (favorite) => {
          const domainFavorite: FavoriteBusinessDomain = {
            id: favorite.id,
            userId: favorite.userId,
            businessId: favorite.businessId,
            createdAt: favorite.createdAt,
          }

          // Include business domain if available
          if (favorite.business) {
            domainFavorite.business = BusinessMapper.fromDocument({
              ...favorite.business,
              avgRating: favorite.business.avgRating.toNumber(),
            })
          }

          return domainFavorite
        },
      )

      const totalPages = Math.ceil(total / limit)

      return {
        data: domainFavorites,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'get favorite businesses',
        'Failed to get favorite businesses',
        error,
      )
    }
  }

  async isFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }> {
    try {
      const favorite = await this.prisma.favouriteBusiness.findUnique({
        where: {
          unique_user_business_favorite: {
            userId,
            businessId,
          },
        },
      })

      return {
        isFavorited: !!favorite,
        favoritedAt: favorite?.createdAt,
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'check favorite business',
        'Failed to check favorite status',
        error,
      )
    }
  }

  async batchAddFavoriteBusinesses(
    userId: string,
    businessIds: string[],
  ): Promise<{ added: number; errors: any[] }> {
    const errors: any[] = []

    let added = 0

    for (const businessId of businessIds) {
      try {
        await this.addFavoriteBusiness(userId, businessId)
        added++
      } catch (error: any) {
        errors.push({
          itemId: businessId,
          operation: 'add',
          error: error.message || 'Failed to add',
        })
      }
    }

    return { added, errors }
  }

  async batchRemoveFavoriteBusinesses(
    userId: string,
    businessIds: string[],
  ): Promise<{ removed: number; errors: any[] }> {
    const errors: any[] = []

    let removed = 0

    for (const businessId of businessIds) {
      try {
        await this.removeFavoriteBusiness(userId, businessId)
        removed++
      } catch (error: any) {
        errors.push({
          itemId: businessId,
          operation: 'remove',
          error: error.message || 'Failed to remove',
        })
      }
    }

    return { removed, errors }
  }

  // =============== Voucher Favorites ===============

  async addFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<FavoriteVoucherDomain> {
    try {
      const [favorite] = await this.prisma.$transaction([
        this.prisma.favouriteVoucher.create({
          data: {
            userId,
            voucherId,
          },
        }),
        this.prisma.voucher.update({
          where: { id: voucherId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ])

      return {
        id: favorite.id,
        userId: favorite.userId,
        voucherId: favorite.voucherId,
        createdAt: favorite.createdAt,
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'favorite_voucher',
          'Voucher already in favorites',
        )
      }
      if (error.code === 'P2003') {
        throw ErrorFactory.resourceNotFound('voucher', voucherId)
      }
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('voucher', voucherId)
      }
      throw ErrorFactory.databaseError(
        'add favorite voucher',
        'Failed to add voucher to favorites',
        error,
      )
    }
  }

  async removeFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.favouriteVoucher.delete({
          where: {
            unique_user_voucher_favorite: {
              userId,
              voucherId,
            },
          },
        }),
        this.prisma.voucher.update({
          where: { id: voucherId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ])
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('favorite_voucher', voucherId)
      }
      throw ErrorFactory.databaseError(
        'remove favorite voucher',
        'Failed to remove voucher from favorites',
        error,
      )
    }
  }

  async getFavoriteVouchers(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'voucherTitle' | 'expiryDate'
      sortOrder?: 'asc' | 'desc'
      parsedIncludes?: ParsedIncludes
    },
  ): Promise<PaginatedResult<FavoriteVoucherDomain>> {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      parsedIncludes,
    } = params
    const skip = (page - 1) * limit

    try {
      const include = this.buildVoucherIncludeClause(parsedIncludes)

      const [data, total] = await Promise.all([
        this.prisma.favouriteVoucher.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy:
            sortBy === 'createdAt' ? { createdAt: sortOrder } : undefined,
          include,
        }),
        this.prisma.favouriteVoucher.count({
          where: { userId },
        }),
      ])

      // Sort by voucher title or expiry date if needed (requires post-query sorting)
      let sortedData = data

      if (parsedIncludes?.voucher) {
        if (sortBy === 'voucherTitle') {
          sortedData = [...data].sort((a, b) => {
            const titleA = a.voucher?.titleKey || ''
            const titleB = b.voucher?.titleKey || ''

            return sortOrder === 'asc'
              ? titleA.localeCompare(titleB)
              : titleB.localeCompare(titleA)
          })
        } else if (sortBy === 'expiryDate') {
          sortedData = [...data].sort((a, b) => {
            const dateA = a.voucher?.validUntil?.getTime() || 0
            const dateB = b.voucher?.validUntil?.getTime() || 0

            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
          })
        }
      }

      // Map to domain entities using VoucherMapper
      const domainFavorites: FavoriteVoucherDomain[] = sortedData.map(
        (favorite) => {
          const domainFavorite: FavoriteVoucherDomain = {
            id: favorite.id,
            userId: favorite.userId,
            voucherId: favorite.voucherId,
            createdAt: favorite.createdAt,
          }

          // Include voucher domain if available
          if (favorite.voucher) {
            domainFavorite.voucher = VoucherMapper.fromDocument({
              ...favorite.voucher,
              // Handle Decimal fields
              discount: favorite.voucher.discount?.toNumber
                ? favorite.voucher.discount.toNumber()
                : favorite.voucher.discount,
              value: favorite.voucher.value?.toNumber
                ? favorite.voucher.value.toNumber()
                : favorite.voucher.value,
            })
          }

          return domainFavorite
        },
      )

      const totalPages = Math.ceil(total / limit)

      return {
        data: domainFavorites,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'get favorite vouchers',
        'Failed to get favorite vouchers',
        error,
      )
    }
  }

  async isFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }> {
    try {
      const favorite = await this.prisma.favouriteVoucher.findUnique({
        where: {
          unique_user_voucher_favorite: {
            userId,
            voucherId,
          },
        },
      })

      return {
        isFavorited: !!favorite,
        favoritedAt: favorite?.createdAt,
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'check favorite voucher',
        'Failed to check favorite status',
        error,
      )
    }
  }

  async batchAddFavoriteVouchers(
    userId: string,
    voucherIds: string[],
  ): Promise<{ added: number; errors: any[] }> {
    const errors: any[] = []

    let added = 0

    for (const voucherId of voucherIds) {
      try {
        await this.addFavoriteVoucher(userId, voucherId)
        added++
      } catch (error: any) {
        errors.push({
          itemId: voucherId,
          operation: 'add',
          error: error.message || 'Failed to add',
        })
      }
    }

    return { added, errors }
  }

  async batchRemoveFavoriteVouchers(
    userId: string,
    voucherIds: string[],
  ): Promise<{ removed: number; errors: any[] }> {
    const errors: any[] = []

    let removed = 0

    for (const voucherId of voucherIds) {
      try {
        await this.removeFavoriteVoucher(userId, voucherId)
        removed++
      } catch (error: any) {
        errors.push({
          itemId: voucherId,
          operation: 'remove',
          error: error.message || 'Failed to remove',
        })
      }
    }

    return { removed, errors }
  }
}
