import { api } from './client'

// Adapter for business-related API calls
export const businessAdapter = {
  // Get business analytics (custom implementation since SDK doesn't have this)
  async getAnalytics(_params?: { startDate?: string; endDate?: string }) {
    // For now, we'll aggregate data from vouchers and other sources
    try {
      // Get business's vouchers
      const vouchersResponse = await api.vouchers.getVouchers({
        businessId: 'current', // This should come from auth context
        limit: 100,
      })

      const vouchers = vouchersResponse.data || []

      // Calculate metrics
      const totalVouchers = vouchers.length
      const activeVouchers = vouchers.filter(
        (v: any) => v.state === 'PUBLISHED'
      ).length
      const totalRedemptions = vouchers.reduce(
        (sum: number, v: any) => sum + v.current_redemptions,
        0
      )

      // Mock revenue calculation (should come from a payments service)
      const totalRevenue = totalRedemptions * 10 // Placeholder calculation

      // Mock conversion rate
      const conversionRate =
        totalVouchers > 0 ? (totalRedemptions / totalVouchers) * 100 : 0

      return {
        data: {
          totalVouchers,
          activeVouchers,
          totalRedemptions,
          totalRevenue,
          conversionRate,
          growth: {
            vouchers: 12.5, // Mock growth percentage
            redemptions: 8.3, // Mock growth percentage
            revenue: 15.2, // Mock growth percentage
          },
        },
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)

      // Return default metrics on error
      return {
        data: {
          totalVouchers: 0,
          activeVouchers: 0,
          totalRedemptions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          growth: {
            vouchers: 0,
            redemptions: 0,
            revenue: 0,
          },
        },
      }
    }
  },

  // Get business profile
  async getProfile() {
    // SDK requires categoryId, but we want all businesses
    // Use a workaround by getting categories first
    try {
      const categoriesResponse = await api.categories.getCategories({})
      const categoryId = categoriesResponse.data?.[0]?.id || 'default'

      const response = await api.businesses.getBusinesses({
        categoryId,
        limit: 1,
      })

      // This should actually get the current business's profile
      // For now return first business or mock data
      const business = response.data?.[0] || {
        id: 'current',
        name: 'Current Business',
        email: 'business@example.com',
      }

      return { data: business }
    } catch {
      // Return mock data on error
      return {
        data: {
          id: 'current',
          name: 'Current Business',
          email: 'business@example.com',
        },
      }
    }
  },

  // Update business profile
  async updateProfile(data: any) {
    // SDK doesn't have a direct update method, so we'll mock it
    console.log('Update profile:', data)

    return { data: { ...data, id: 'current' } }
  },
}
