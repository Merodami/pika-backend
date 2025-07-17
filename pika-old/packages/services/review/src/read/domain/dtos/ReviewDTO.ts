// Review DTOs for read operations

export type ReviewStatsDTO = {
  providerId: string
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  reviewsWithText: number
  responseRate: number
}
