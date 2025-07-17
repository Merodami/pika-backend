import { ReviewMapper } from '@pika/sdk'
import { Review } from '@review-read/domain/entities/Review.js'

/**
 * Adapter that bridges the local Review domain entity with SDK's ReviewMapper
 * Following the established pattern from Provider and Campaign services
 * This allows us to keep domain entities clean while leveraging SDK's DTO conversion
 */
export class ReviewDomainAdapter {
  /**
   * Converts local Review domain entity to SDK-compatible format
   */
  static toSdkDomain(review: Review): any {
    const data = review.toObject()

    return {
      id: data.id,
      providerId: data.providerId,
      customerId: data.customerId,
      rating: data.rating,
      review: data.review,
      response: data.response,
      responseAt: data.responseAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    }
  }

  /**
   * Converts local Review domain entity to API DTO format
   * Uses SDK's ReviewMapper to handle snake_case conversion
   */
  static toDTO(review: Review): any {
    const sdkDomain = this.toSdkDomain(review)

    return ReviewMapper.toDTO(sdkDomain)
  }

  /**
   * Converts multiple domain entities to DTOs
   */
  static toDTOs(reviews: Review[]): any[] {
    return reviews.map((review) => this.toDTO(review))
  }
}
