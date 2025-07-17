/**
 * Review entity in the Domain layer - Read Side
 * Represents customer feedback for providers
 * Following Admin Service Gold Standard pattern
 */

export interface ReviewData {
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

export class Review {
  public readonly id: string
  public readonly providerId: string
  public readonly customerId: string
  public readonly rating: number
  public readonly review: string | null
  public readonly response: string | null
  public readonly responseAt: Date | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null
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
   * Factory method for creating Review instances
   * Following Admin Service pattern
   */
  static create(data: ReviewData): Review {
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
   * Check if review is active (not deleted)
   */
  isActive(): boolean {
    return !this.isDeleted()
  }

  /**
   * Get the age of the review in days
   */
  getAgeInDays(): number {
    if (!this.createdAt) return 0

    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * Check if the review is recent (less than 7 days old)
   */
  isRecent(): boolean {
    return this.getAgeInDays() <= 7
  }

  /**
   * Get response time in days
   */
  getResponseTimeInDays(): number | null {
    if (!this.responseAt || !this.createdAt) return null

    const diffTime = Math.abs(
      this.responseAt.getTime() - this.createdAt.getTime(),
    )
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * Check if the provider responded quickly (within 24 hours)
   */
  hasQuickResponse(): boolean {
    const responseTime = this.getResponseTimeInDays()

    return responseTime !== null && responseTime <= 1
  }

  /**
   * Get rating as stars (for display)
   */
  getRatingStars(): string {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating)
  }

  /**
   * Check if this is a high rating (4 or 5 stars)
   */
  isHighRating(): boolean {
    return this.rating >= 4
  }

  /**
   * Check if this is a low rating (1 or 2 stars)
   */
  isLowRating(): boolean {
    return this.rating <= 2
  }

  /**
   * Serialize to plain object
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
