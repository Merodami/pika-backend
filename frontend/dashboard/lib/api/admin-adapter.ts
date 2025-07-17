import { api } from './client'

// Adapter for admin-related API calls
export const adminAdapter = {
  // Get platform analytics (aggregate from various services)
  async getPlatformAnalytics() {
    try {
      // Get data from various services
      // Get current user to determine count (SDK doesn't have list users endpoint)
      const currentUser = await api.users.getCurrentUser()

      const [vouchersResponse, categoriesResponse] = await Promise.all([
        api.vouchers.getVouchers({ limit: 1 }), // Just to get total count
        api.categories.getCategories({}), // Get all categories
      ])

      // Get businesses count (requires categoryId)
      const categoryId = categoriesResponse.data?.[0]?.id || 'default'
      const businessesResponse = await api.businesses.getBusinesses({
        categoryId,
        limit: 1,
      })

      // Calculate totals from pagination metadata
      const totalUsers = currentUser ? 1 : 0 // Mock count since we can't list users
      const totalBusinesses = businessesResponse.pagination?.total || 0
      const totalVouchers = vouchersResponse.pagination?.total || 0

      // Mock redemptions count (should come from redemptions service)
      const totalRedemptions = 0

      return {
        data: {
          totalUsers,
          totalBusinesses,
          totalVouchers,
          totalRedemptions,
          growth: {
            users: 15.2, // Mock growth percentage
            businesses: 8.5, // Mock growth percentage
            vouchers: 12.3, // Mock growth percentage
            redemptions: 20.1, // Mock growth percentage
          },
        },
      }
    } catch (error) {
      console.error('Failed to fetch platform analytics:', error)

      return {
        data: {
          totalUsers: 0,
          totalBusinesses: 0,
          totalVouchers: 0,
          totalRedemptions: 0,
          growth: {
            users: 0,
            businesses: 0,
            vouchers: 0,
            redemptions: 0,
          },
        },
      }
    }
  },

  // Get businesses list for admin
  async getBusinesses(params?: {
    status?: string
    page?: number
    limit?: number
  }) {
    try {
      // Get a category first (SDK requires it)
      const categoriesResponse = await api.categories.getCategories({})
      const categoryId = categoriesResponse.data?.[0]?.id || 'default'

      const response = await api.businesses.getBusinesses({
        categoryId,
        verified: params?.status === 'verified' ? true : undefined,
        active: params?.status !== 'suspended' ? true : false,
        page: params?.page,
        limit: params?.limit || 10,
      })

      // Transform businesses to match expected format
      const items = (response.data || []).map((business: any) => ({
        id: business.id,
        name: business.business_name || 'Unknown Business',
        email: business.contact_email || '',
        status: (business.verified ? 'verified' : 'pending') as
          | 'pending'
          | 'verified'
          | 'suspended',
        createdAt: business.created_at,
      }))

      return {
        data: {
          items,
          total: response.pagination?.total || 0,
        },
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error)

      return {
        data: {
          items: [],
          total: 0,
        },
      }
    }
  },

  // Get users list for admin (mock implementation)
  async getUsers(params?: {
    role?: string
    page?: number
    search?: string
    limit?: number
  }) {
    // SDK doesn't have a list users endpoint, return mock data
    console.log('Get users:', params)

    return {
      data: {
        items: [],
        total: 0,
      },
    }
  },

  // Update user (mock implementation)
  async updateUser(id: string, data: any) {
    console.log('Update user:', id, data)

    // SDK doesn't have user update endpoint
    return { data: { ...data, id } }
  },

  // Verify business (mock implementation)
  async verifyBusiness(id: string) {
    console.log('Verify business:', id)

    // SDK doesn't have business verification endpoint
    return { data: { success: true } }
  },
}
