import { Review } from '@review-write/domain/entities/Review.js'

/**
 * Maps between Prisma Review documents and Review domain entities
 * Following the established pattern from Admin Service
 */
export interface ReviewWriteDocument {
  id: string
  providerId: string
  customerId: string
  rating: number
  review: string | null
  response: string | null
  responseAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class ReviewDocumentMapper {
  /**
   * Maps a database document to a Review domain entity
   */
  static mapDocumentToDomain(document: ReviewWriteDocument): Review {
    return Review.reconstitute({
      id: document.id,
      providerId: document.providerId,
      customerId: document.customerId,
      rating: document.rating,
      review: document.review,
      response: document.response,
      responseAt: document.responseAt ? new Date(document.responseAt) : null,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
      deletedAt: document.deletedAt ? new Date(document.deletedAt) : null,
    })
  }

  /**
   * Maps a Review domain entity to database document format for creation
   */
  static mapDomainToCreateData(
    review: Review,
  ): Omit<ReviewWriteDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      providerId: review.providerId,
      customerId: review.customerId,
      rating: review.rating,
      review: review.review,
      response: review.response,
      responseAt: review.responseAt,
      deletedAt: review.deletedAt,
    }
  }

  /**
   * Maps a Review domain entity to database document format for updates
   */
  static mapDomainToUpdateData(review: Review): Partial<ReviewWriteDocument> {
    return {
      rating: review.rating,
      review: review.review,
      response: review.response,
      responseAt: review.responseAt,
      deletedAt: review.deletedAt,
      updatedAt: review.updatedAt,
    }
  }
}
