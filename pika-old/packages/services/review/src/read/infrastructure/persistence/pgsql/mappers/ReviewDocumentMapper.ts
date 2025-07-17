import { Review } from '@review-read/domain/entities/Review.js'

/**
 * Maps between Prisma Review documents and Review domain entities
 * Following the established pattern from Admin Service
 */
export interface ReviewDocument {
  id: string
  providerId: string
  customerId: string
  rating: number
  review: string | null
  response: string | null
  responseAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export class ReviewDocumentMapper {
  /**
   * Maps a database document to a Review domain entity
   */
  static mapDocumentToDomain(document: ReviewDocument): Review {
    return Review.create({
      id: document.id,
      providerId: document.providerId,
      customerId: document.customerId,
      rating: document.rating,
      review: document.review,
      response: document.response,
      responseAt: document.responseAt ? new Date(document.responseAt) : null,
      createdAt: document.createdAt ? new Date(document.createdAt) : null,
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : null,
      deletedAt: document.deletedAt ? new Date(document.deletedAt) : null,
    })
  }

  /**
   * Maps multiple database documents to domain entities
   */
  static mapDocumentsToDomain(documents: ReviewDocument[]): Review[] {
    return documents.map((doc) => this.mapDocumentToDomain(doc))
  }

  /**
   * Maps a domain entity to database document format
   */
  static mapDomainToDocument(review: Review): Partial<ReviewDocument> {
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
}
