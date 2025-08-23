import type { PrismaClient, FavouriteBusiness, FavouriteVoucher } from '@prisma/client'
import { ErrorFactory } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import { BusinessMapper, VoucherMapper } from '@pika/sdk'

export interface IUserFavoriteRepository {
  // Business favorites
  addFavoriteBusiness(userId: string, businessId: string): Promise<FavouriteBusiness>
  removeFavoriteBusiness(userId: string, businessId: string): Promise<void>
  getFavoriteBusinesses(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'businessName'
      sortOrder?: 'asc' | 'desc'
      includeDetails?: boolean
    },
  ): Promise<PaginatedResult<FavouriteBusiness>>
  isFavoriteBusiness(userId: string, businessId: string): Promise<{ isFavorited: boolean; favoritedAt?: Date }>
  batchAddFavoriteBusinesses(userId: string, businessIds: string[]): Promise<{ added: number; errors: any[] }>
  batchRemoveFavoriteBusinesses(userId: string, businessIds: string[]): Promise<{ removed: number; errors: any[] }>

  // Voucher favorites
  addFavoriteVoucher(userId: string, voucherId: string): Promise<FavouriteVoucher>
  removeFavoriteVoucher(userId: string, voucherId: string): Promise<void>
  getFavoriteVouchers(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'voucherTitle' | 'expiryDate'
      sortOrder?: 'asc' | 'desc'
      includeDetails?: boolean
    },
  ): Promise<PaginatedResult<FavouriteVoucher>>
  isFavoriteVoucher(userId: string, voucherId: string): Promise<{ isFavorited: boolean; favoritedAt?: Date }>
  batchAddFavoriteVouchers(userId: string, voucherIds: string[]): Promise<{ added: number; errors: any[] }>
  batchRemoveFavoriteVouchers(userId: string, voucherIds: string[]): Promise<{ removed: number; errors: any[] }>
}

export class UserFavoriteRepository implements IUserFavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // =============== Business Favorites ===============

  async addFavoriteBusiness(userId: string, businessId: string): Promise<FavouriteBusiness> {
    try {
      // Create favorite and increment counter in a transaction
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

      return favorite
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict('favorite_business', 'Business already in favorites')
      }
      if (error.code === 'P2003') {
        throw ErrorFactory.resourceNotFound('business', businessId)
      }
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('business', businessId)
      }
      throw ErrorFactory.databaseError('add favorite business', 'Failed to add business to favorites', error)
    }
  }

  async removeFavoriteBusiness(userId: string, businessId: string): Promise<void> {
    try {
      // Remove favorite and decrement counter in a transaction
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
      throw ErrorFactory.databaseError('remove favorite business', 'Failed to remove business from favorites', error)
    }
  }

  async getFavoriteBusinesses(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'businessName'
      sortOrder?: 'asc' | 'desc'
      includeDetails?: boolean
    },
  ): Promise<PaginatedResult<FavouriteBusiness>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', includeDetails = false } = params
    const skip = (page - 1) * limit

    try {
      const [data, total] = await this.prisma.$transaction([
        this.prisma.favouriteBusiness.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } : undefined,
          include: includeDetails
            ? {
                business: {
                  include: {
                    category: true,
                    businessDetails: true,
                  },
                },
              }
            : undefined,
        }),
        this.prisma.favouriteBusiness.count({
          where: { userId },
        }),
      ])

      // Sort by business name if needed (requires post-query sorting)
      let sortedData = data
      if (sortBy === 'businessName' && includeDetails) {
        sortedData = [...data].sort((a, b) => {
          const nameA = (a as any).business?.businessNameKey || ''
          const nameB = (b as any).business?.businessNameKey || ''
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        })
      }

      // Transform to domain objects using BusinessMapper (following business service pattern)
      const domainFavorites = sortedData.map((favorite) => {
        const baseFavorite = {
          id: favorite.id,
          businessId: favorite.businessId,
          createdAt: favorite.createdAt,
          business: favorite.business ? 
            BusinessMapper.toDTO(BusinessMapper.fromDocument({
              ...favorite.business,
              avgRating: (favorite.business as any).avgRating?.toNumber ? (favorite.business as any).avgRating.toNumber() : (favorite.business as any).avgRating || 0,
            })) : undefined,
        }
        return baseFavorite
      })

      return {
        data: domainFavorites,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError('get favorite businesses', 'Failed to get favorite businesses', error)
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
      throw ErrorFactory.databaseError('check favorite business', 'Failed to check favorite status', error)
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

  async addFavoriteVoucher(userId: string, voucherId: string): Promise<FavouriteVoucher> {
    try {
      // Create favorite and increment counter in a transaction
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

      return favorite
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict('favorite_voucher', 'Voucher already in favorites')
      }
      if (error.code === 'P2003') {
        throw ErrorFactory.resourceNotFound('voucher', voucherId)
      }
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('voucher', voucherId)
      }
      throw ErrorFactory.databaseError('add favorite voucher', 'Failed to add voucher to favorites', error)
    }
  }

  async removeFavoriteVoucher(userId: string, voucherId: string): Promise<void> {
    try {
      // Remove favorite and decrement counter in a transaction
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
      throw ErrorFactory.databaseError('remove favorite voucher', 'Failed to remove voucher from favorites', error)
    }
  }

  async getFavoriteVouchers(
    userId: string,
    params: {
      page: number
      limit: number
      sortBy?: 'createdAt' | 'voucherTitle' | 'expiryDate'
      sortOrder?: 'asc' | 'desc'
      includeDetails?: boolean
    },
  ): Promise<PaginatedResult<FavouriteVoucher>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', includeDetails = false } = params
    const skip = (page - 1) * limit

    try {
      const [data, total] = await this.prisma.$transaction([
        this.prisma.favouriteVoucher.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } : undefined,
          include: includeDetails
            ? {
                voucher: {
                  include: {
                    business: true,
                    category: true,
                  },
                },
              }
            : undefined,
        }),
        this.prisma.favouriteVoucher.count({
          where: { userId },
        }),
      ])

      // Sort by voucher title or expiry date if needed (requires post-query sorting)
      let sortedData = data
      if (includeDetails) {
        if (sortBy === 'voucherTitle') {
          sortedData = [...data].sort((a, b) => {
            const titleA = (a as any).voucher?.titleKey || ''
            const titleB = (b as any).voucher?.titleKey || ''
            return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
          })
        } else if (sortBy === 'expiryDate') {
          sortedData = [...data].sort((a, b) => {
            const dateA = (a as any).voucher?.validUntil?.getTime() || 0
            const dateB = (b as any).voucher?.validUntil?.getTime() || 0
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
          })
        }
      }

      // Transform to domain objects using VoucherMapper (following business service pattern)  
      const domainFavorites = sortedData.map((favorite) => {
        const baseFavorite = {
          id: favorite.id,
          voucherId: favorite.voucherId,
          createdAt: favorite.createdAt,
          voucher: favorite.voucher ? 
            VoucherMapper.toDTO(VoucherMapper.fromDocument({
              ...favorite.voucher,
              // Handle Decimal fields if they exist
              discount: (favorite.voucher as any).discount?.toNumber ? (favorite.voucher as any).discount.toNumber() : (favorite.voucher as any).discount,
              value: (favorite.voucher as any).value?.toNumber ? (favorite.voucher as any).value.toNumber() : (favorite.voucher as any).value,
            })) : undefined,
        }
        return baseFavorite
      })

      return {
        data: domainFavorites,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError('get favorite vouchers', 'Failed to get favorite vouchers', error)
    }
  }

  async isFavoriteVoucher(userId: string, voucherId: string): Promise<{ isFavorited: boolean; favoritedAt?: Date }> {
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
      throw ErrorFactory.databaseError('check favorite voucher', 'Failed to check favorite status', error)
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