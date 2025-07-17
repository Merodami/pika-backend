import type { PaginatedResult } from '@pika/types-core'
import { GetReviewQuery } from '@review-read/application/use_cases/queries/GetReviewQuery.js'
import { ReviewSearchQuery } from '@review-read/application/use_cases/queries/ReviewSearchQuery.js'
import { ReviewStatsDTO } from '@review-read/domain/dtos/ReviewDTO.js'
import { Review } from '@review-read/domain/entities/Review.js'

/**
 * ReviewReadRepositoryPort defines the contract for review data access in the read model.
 * Implementations of this interface handle retrieval operations for reviews.
 */
export interface ReviewReadRepositoryPort {
  /**
   * Retrieve all reviews matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated review results
   */
  getAllReviews(query: ReviewSearchQuery): Promise<PaginatedResult<Review>>

  /**
   * Retrieve a single review by its unique identifier
   *
   * @param query - Query parameters containing ID and optional include flags
   * @returns Promise with the review or null if not found
   */
  getReviewById(query: GetReviewQuery): Promise<Review | null>

  /**
   * Retrieve all reviews for a specific provider
   *
   * @param providerId - The provider's unique identifier
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated review results
   */
  getReviewsByProvider(
    providerId: string,
    query: ReviewSearchQuery,
  ): Promise<PaginatedResult<Review>>

  /**
   * Retrieve all reviews by a specific customer
   *
   * @param customerId - The customer's unique identifier
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated review results
   */
  getReviewsByCustomer(
    customerId: string,
    query: ReviewSearchQuery,
  ): Promise<PaginatedResult<Review>>

  /**
   * Get aggregated review statistics for a provider
   *
   * @param providerId - The provider's unique identifier
   * @returns Promise with review statistics
   */
  getReviewStats(providerId: string): Promise<ReviewStatsDTO>

  /**
   * Check if a customer has already reviewed a provider
   *
   * @param customerId - The customer's unique identifier
   * @param providerId - The provider's unique identifier
   * @returns Promise with boolean indicating if review exists
   */
  hasCustomerReviewedProvider(
    customerId: string,
    providerId: string,
  ): Promise<boolean>
}
