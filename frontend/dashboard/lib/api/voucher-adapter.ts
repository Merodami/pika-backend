import { api } from './client'

// Adapter to map SDK responses to the expected format in components
export const voucherAdapter = {
  // Get all vouchers with proper response structure
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    category?: string
  }) {
    // Map component status to SDK state
    const stateMapping: Record<string, string> = {
      active: 'PUBLISHED',
      draft: 'NEW',
      paused: 'PUBLISHED', // SDK doesn't have paused state
      expired: 'EXPIRED',
    }

    const response = await api.vouchers.getVouchers({
      page: params?.page,
      limit: params?.limit,
      state:
        params?.status && params.status !== 'all'
          ? (stateMapping[params.status] as any)
          : undefined,
      categoryId:
        params?.category && params.category !== 'all'
          ? params.category
          : undefined,
    })

    // Transform response to match expected format
    const vouchers = (response.data || []).map(transformVoucherDto)

    return {
      data: {
        vouchers,
        total: response.pagination?.total || 0,
        stats: {
          total: response.pagination?.total || 0,
          active: vouchers.filter((v: any) => v.status === 'active').length,
          draft: vouchers.filter((v: any) => v.status === 'draft').length,
          paused: vouchers.filter((v: any) => v.status === 'paused').length,
        },
      },
    }
  },

  // Create voucher
  async create(data: any) {
    const response = await api.vouchers.createVoucher({
      requestBody: {
        business_id: data.businessId || '', // This should come from auth context
        category_id: data.categoryId,
        title: data.title,
        description: data.description,
        terms: data.terms || {},
        discount_type:
          data.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        discount_value: data.discountValue,
        currency: data.currency || 'USD',
        location: data.location || {},
        image_url: data.imageUrl,
        valid_from: data.validFrom,
        expires_at: data.validUntil,
        max_redemptions: data.maxRedemptions,
        max_redemptions_per_user: data.maxRedemptionsPerUser || 1,
        metadata: data.metadata || {},
      },
    })

    return { data: transformVoucherDto(response) }
  },

  // Delete voucher
  async delete(id: string) {
    await api.vouchers.deleteVoucher({ voucherId: id })

    return { data: { success: true } }
  },

  // Pause voucher (not directly supported by SDK, use expire)
  async pause(id: string) {
    // Store original state in metadata before expiring
    const voucher = await api.vouchers.getVoucherById({ voucherId: id })

    await api.vouchers.updateVoucher({
      voucherId: id,
      requestBody: {
        metadata: {
          ...voucher.metadata,
          paused: true,
          originalExpiresAt: voucher.expires_at,
        },
      },
    })
    await api.vouchers.expireVoucher({ voucherId: id })

    return { data: { success: true } }
  },

  // Resume voucher (restore from paused state)
  async resume(id: string) {
    const voucher = await api.vouchers.getVoucherById({ voucherId: id })

    if (voucher.metadata?.paused && voucher.metadata?.originalExpiresAt) {
      await api.vouchers.updateVoucher({
        voucherId: id,
        requestBody: {
          expires_at: voucher.metadata.originalExpiresAt,
          metadata: {
            ...voucher.metadata,
            paused: false,
            originalExpiresAt: undefined,
          },
        },
      })
      // Re-publish if it was published before
      await api.vouchers.publishVoucher({ voucherId: id })
    }

    return { data: { success: true } }
  },

  // Save draft (just create without publishing)
  async saveDraft(data: any) {
    return this.create(data) // Creates in NEW state by default
  },
}

// Transform VoucherDto to component's expected format
function transformVoucherDto(dto: any): any {
  // Map SDK state to component status
  let status = 'draft'

  if (dto.state === 'PUBLISHED') {
    status = dto.metadata?.paused ? 'paused' : 'active'
  } else if (dto.state === 'NEW') {
    status = 'draft'
  } else if (dto.state === 'EXPIRED') {
    status = 'expired'
  }

  return {
    id: dto.id,
    title: dto.title?.en || dto.title,
    description: dto.description?.en || dto.description,
    category: dto.category_id, // Should ideally fetch category name
    discountType:
      dto.discount_type === 'PERCENTAGE' ? 'percentage' : 'fixed_amount',
    discountValue: dto.discount_value,
    status,
    validFrom: dto.valid_from,
    validUntil: dto.expires_at,
    maxRedemptions: dto.max_redemptions,
    currentRedemptions: dto.current_redemptions,
    businessName: '', // Should come from business
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}
