import { v4 as uuid } from 'uuid'

/**
 * Review entity in the Domain layer (Write side)
 * Represents customer feedback for providers
 * Following Admin Service Gold Standard pattern
 */

export interface ReviewProps {
  providerId: string
  customerId: string
  rating: number
  review: string | null
  response: string | null
  responseAt: Date | null
}

export interface ReviewData extends ReviewProps {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Review {
  public readonly id: string
  public readonly providerId: string
  public readonly customerId: string
  public readonly rating: number
  public readonly review: string | null
  public readonly response: string | null
  public readonly responseAt: Date | null
  public readonly createdAt: Date
  public readonly updatedAt: Date
  public readonly deletedAt: Date | null

  private constructor(data: ReviewData) {
    this.id = data.id
    this.providerId = data.providerId
    this.customerId = data.customerId
    this.rating = data.rating
    this.review = data.review
    this.response = data.response
    this.responseAt = data.responseAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.deletedAt = data.deletedAt

    this.validateInvariants()
  }

  /**
   * Factory method for creating new reviews
   */
  static create(props: ReviewProps): Review {
    return new Review({
      id: uuid(),
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }

  /**
   * Factory method for reconstituting reviews from persistence
   */
  static reconstitute(data: ReviewData): Review {
    return new Review(data)
  }

  /**
   * Validates domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) throw new Error('Review ID is required')
    if (!this.providerId) throw new Error('Provider ID is required')
    if (!this.customerId) throw new Error('Customer ID is required')
    if (!this.isValidRating()) {
      throw new Error('Rating must be between 1 and 5')
    }
    if (this.hasProviderResponse() && !this.responseAt) {
      throw new Error('Response date is required when response is provided')
    }
  }

  /**
   * Update the review content
   */
  update(reviewText: string | null): Review {
    if (this.isDeleted()) {
      throw new Error('Cannot update a deleted review')
    }

    return new Review({
      ...this.toObject(),
      review: reviewText,
      updatedAt: new Date(),
    })
  }

  /**
   * Add provider response to the review
   */
  addProviderResponse(responseText: string): Review {
    if (this.isDeleted()) {
      throw new Error('Cannot respond to a deleted review')
    }
    if (this.hasProviderResponse()) {
      throw new Error('Review already has a provider response')
    }
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Response text cannot be empty')
    }

    return new Review({
      ...this.toObject(),
      response: responseText,
      responseAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Soft delete the review
   */
  delete(): Review {
    if (this.isDeleted()) {
      throw new Error('Review is already deleted')
    }

    return new Review({
      ...this.toObject(),
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Checks if the review has a text comment
   */
  hasReviewText(): boolean {
    return this.review !== null && this.review.trim().length > 0
  }

  /**
   * Checks if the provider has responded to this review
   */
  hasProviderResponse(): boolean {
    return this.response !== null && this.response.trim().length > 0
  }

  /**
   * Validates if the rating is within the acceptable range (1-5)
   */
  isValidRating(): boolean {
    return this.rating >= 1 && this.rating <= 5
  }

  /**
   * Checks if this review is soft deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  /**
   * Check if review can be edited by customer
   */
  canBeEditedBy(customerId: string): boolean {
    return this.customerId === customerId && !this.isDeleted()
  }

  /**
   * Check if review can be responded to by provider
   */
  canBeRespondedToBy(providerId: string): boolean {
    return (
      this.providerId === providerId &&
      !this.isDeleted() &&
      !this.hasProviderResponse()
    )
  }

  /**
   * Get the age of the review in days
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * Check if review is editable (within 30 days)
   */
  isEditable(): boolean {
    return this.getAgeInDays() <= 30 && !this.isDeleted()
  }

  /**
   * Converts the Review entity to a plain object
   */
  toObject(): ReviewData {
    return {
      id: this.id,
      providerId: this.providerId,
      customerId: this.customerId,
      rating: this.rating,
      review: this.review,
      response: this.response,
      responseAt: this.responseAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    }
  }
}
