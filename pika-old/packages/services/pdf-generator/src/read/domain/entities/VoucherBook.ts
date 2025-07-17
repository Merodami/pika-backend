import {
  AdSize,
  PageLayoutType,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'

/**
 * VoucherBook READ Domain Entity - Following Admin Service Gold Standard
 * Represents a voucher book for PDF generation with rich business logic
 */

export interface VoucherBookData {
  id: string
  title: string
  edition: string | null
  bookType: VoucherBookType
  month: number | null
  year: number
  status: VoucherBookStatus
  totalPages: number
  coverImageUrl: string | null
  backImageUrl: string | null
  publishedAt: Date | null
  pdfUrl: string | null
  pdfGeneratedAt: Date | null
  metadata: Record<string, any> | null
  createdBy: string
  providerId: string | null
  createdAt: Date | null
  updatedAt: Date | null
  pages?: VoucherBookPage[]
}

export class VoucherBook {
  public readonly id: string
  public readonly title: string
  public readonly edition: string | null
  public readonly bookType: VoucherBookType
  public readonly month: number | null
  public readonly year: number
  public readonly status: VoucherBookStatus
  public readonly totalPages: number
  public readonly coverImageUrl: string | null
  public readonly backImageUrl: string | null
  public readonly publishedAt: Date | null
  public readonly pdfUrl: string | null
  public readonly pdfGeneratedAt: Date | null
  public readonly metadata: Record<string, any> | null
  public readonly createdBy: string
  public readonly providerId: string | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null
  public readonly pages?: VoucherBookPage[]

  private constructor(data: VoucherBookData) {
    this.id = data.id
    this.title = data.title
    this.edition = data.edition
    this.bookType = data.bookType
    this.month = data.month
    this.year = data.year
    this.status = data.status
    this.totalPages = data.totalPages
    this.coverImageUrl = data.coverImageUrl
    this.backImageUrl = data.backImageUrl
    this.publishedAt = data.publishedAt
    this.pdfUrl = data.pdfUrl
    this.pdfGeneratedAt = data.pdfGeneratedAt
    this.metadata = data.metadata
    this.createdBy = data.createdBy
    this.providerId = data.providerId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.pages = data.pages

    this.validateInvariants()
  }

  /**
   * Factory method for creating VoucherBook instances
   */
  static create(data: VoucherBookData): VoucherBook {
    return new VoucherBook(data)
  }

  /**
   * Validates domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) throw new Error('VoucherBook ID is required')
    if (!this.title) throw new Error('VoucherBook title is required')
    if (!this.year || this.year < 2020 || this.year > 2100) {
      throw new Error('VoucherBook year must be between 2020 and 2100')
    }
    if (this.month !== null && (this.month < 1 || this.month > 12)) {
      throw new Error('VoucherBook month must be between 1 and 12')
    }
    if (this.totalPages < 1) {
      throw new Error('VoucherBook must have at least 1 page')
    }
  }

  /**
   * Checks if the book is published
   */
  isPublished(): boolean {
    return this.status === VoucherBookStatus.PUBLISHED
  }

  /**
   * Checks if the book is ready for PDF generation
   */
  isReadyForGeneration(): boolean {
    return this.status === VoucherBookStatus.READY_FOR_PRINT
  }

  /**
   * Checks if the book has a generated PDF
   */
  hasPDF(): boolean {
    return this.pdfUrl !== null && this.pdfGeneratedAt !== null
  }

  /**
   * Gets the display name for the book (title + edition if available)
   */
  getDisplayName(): string {
    return this.edition ? `${this.title} - ${this.edition}` : this.title
  }

  /**
   * Gets the display period for the book (month/year)
   */
  getDisplayPeriod(): string {
    if (this.month) {
      const monthName = new Date(2000, this.month - 1, 1).toLocaleString('en', {
        month: 'long',
      })

      return `${monthName} ${this.year}`
    }

    return this.year.toString()
  }

  /**
   * Checks if the book is a draft
   */
  isDraft(): boolean {
    return this.status === VoucherBookStatus.DRAFT
  }

  /**
   * Checks if the book is archived
   */
  isArchived(): boolean {
    return this.status === VoucherBookStatus.ARCHIVED
  }

  /**
   * Checks if the book can be edited
   */
  canBeEdited(): boolean {
    return this.status === VoucherBookStatus.DRAFT
  }

  /**
   * Checks if the book can be published
   */
  canBePublished(): boolean {
    return this.status === VoucherBookStatus.READY_FOR_PRINT && this.hasPDF()
  }

  /**
   * Gets the age of the book in days
   */
  getAgeInDays(): number {
    if (!this.createdAt) return 0

    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Checks if the book was recently created (within 7 days)
   */
  isRecent(): boolean {
    return this.getAgeInDays() <= 7
  }

  /**
   * Gets the number of pages with placements
   */
  getPagesWithPlacements(): number {
    if (!this.pages) return 0

    return this.pages.filter(
      (page) => page.adPlacements && page.adPlacements.length > 0,
    ).length
  }

  /**
   * Gets the completion percentage based on pages with placements
   */
  getCompletionPercentage(): number {
    if (!this.totalPages || this.totalPages === 0) return 0

    const pagesWithPlacements = this.getPagesWithPlacements()

    return Math.round((pagesWithPlacements / this.totalPages) * 100)
  }

  /**
   * Alias for pdfGeneratedAt to match VoucherBookDomain interface
   */
  get generatedAt(): Date | null {
    return this.pdfGeneratedAt
  }

  /**
   * Converts the VoucherBook entity to a plain object
   */
  toObject(): VoucherBookData {
    return {
      id: this.id,
      title: this.title,
      edition: this.edition,
      bookType: this.bookType,
      month: this.month,
      year: this.year,
      status: this.status,
      totalPages: this.totalPages,
      coverImageUrl: this.coverImageUrl,
      backImageUrl: this.backImageUrl,
      publishedAt: this.publishedAt,
      pdfUrl: this.pdfUrl,
      pdfGeneratedAt: this.pdfGeneratedAt,
      metadata: this.metadata,
      createdBy: this.createdBy,
      providerId: this.providerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      pages: this.pages,
    }
  }
}

/**
 * VoucherBookPage Entity - Following Admin Service Gold Standard
 */

export interface VoucherBookPageData {
  id: string
  bookId: string
  pageNumber: number
  layoutType: PageLayoutType
  metadata: Record<string, any> | null
  createdAt: Date | null
  updatedAt: Date | null
  adPlacements?: AdPlacement[]
}

export class VoucherBookPage {
  public readonly id: string
  public readonly bookId: string
  public readonly pageNumber: number
  public readonly layoutType: PageLayoutType
  public readonly metadata: Record<string, any> | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null
  public readonly adPlacements?: AdPlacement[]

  private constructor(data: VoucherBookPageData) {
    this.id = data.id
    this.bookId = data.bookId
    this.pageNumber = data.pageNumber
    this.layoutType = data.layoutType
    this.metadata = data.metadata
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.adPlacements = data.adPlacements

    this.validateInvariants()
  }

  /**
   * Factory method for creating VoucherBookPage instances
   */
  static create(data: VoucherBookPageData): VoucherBookPage {
    return new VoucherBookPage(data)
  }

  /**
   * Validates domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) throw new Error('VoucherBookPage ID is required')
    if (!this.bookId) throw new Error('VoucherBookPage bookId is required')
    if (this.pageNumber < 1) throw new Error('Page number must be at least 1')
  }

  /**
   * Gets the number of placements on this page
   */
  getPlacementCount(): number {
    return this.adPlacements?.length || 0
  }

  /**
   * Checks if the page is full (8 single spaces)
   */
  isFull(): boolean {
    if (!this.adPlacements) return false

    const totalSpaces = this.adPlacements.reduce((sum, placement) => {
      switch (placement.size) {
        case AdSize.SINGLE:
          return sum + 1
        case AdSize.QUARTER:
          return sum + 2
        case AdSize.HALF:
          return sum + 4
        case AdSize.FULL:
          return sum + 8
        default:
          return sum
      }
    }, 0)

    return totalSpaces >= 8
  }

  /**
   * Gets available space count on the page
   */
  getAvailableSpaces(): number {
    if (!this.adPlacements) return 8

    const usedSpaces = this.adPlacements.reduce((sum, placement) => {
      switch (placement.size) {
        case AdSize.SINGLE:
          return sum + 1
        case AdSize.QUARTER:
          return sum + 2
        case AdSize.HALF:
          return sum + 4
        case AdSize.FULL:
          return sum + 8
        default:
          return sum
      }
    }, 0)

    return Math.max(0, 8 - usedSpaces)
  }

  /**
   * Converts the entity to a plain object
   */
  toObject(): VoucherBookPageData {
    return {
      id: this.id,
      bookId: this.bookId,
      pageNumber: this.pageNumber,
      layoutType: this.layoutType,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      adPlacements: this.adPlacements,
    }
  }
}

/**
 * AdPlacement Entity - Following Admin Service Gold Standard
 */

export interface AdPlacementData {
  id: string
  pageId: string
  voucherId: string
  providerId: string
  position: number
  size: AdSize
  imageUrl: string | null
  qrCodePayload: string
  shortCode: string
  metadata: Record<string, any> | null
  createdAt: Date | null
  updatedAt: Date | null
}

export class AdPlacement {
  public readonly id: string
  public readonly pageId: string
  public readonly voucherId: string
  public readonly providerId: string
  public readonly position: number
  public readonly size: AdSize
  public readonly imageUrl: string | null
  public readonly qrCodePayload: string
  public readonly shortCode: string
  public readonly metadata: Record<string, any> | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null

  private constructor(data: AdPlacementData) {
    this.id = data.id
    this.pageId = data.pageId
    this.voucherId = data.voucherId
    this.providerId = data.providerId
    this.position = data.position
    this.size = data.size
    this.imageUrl = data.imageUrl
    this.qrCodePayload = data.qrCodePayload
    this.shortCode = data.shortCode
    this.metadata = data.metadata
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    this.validateInvariants()
  }

  /**
   * Factory method for creating AdPlacement instances
   */
  static create(data: AdPlacementData): AdPlacement {
    return new AdPlacement(data)
  }

  /**
   * Validates domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) throw new Error('AdPlacement ID is required')
    if (!this.pageId) throw new Error('AdPlacement pageId is required')
    if (!this.voucherId) throw new Error('AdPlacement voucherId is required')
    if (!this.providerId) throw new Error('AdPlacement providerId is required')
    if (!this.qrCodePayload)
      throw new Error('AdPlacement qrCodePayload is required')
    if (!this.shortCode) throw new Error('AdPlacement shortCode is required')
    if (this.position < 1 || this.position > 8) {
      throw new Error('AdPlacement position must be between 1 and 8')
    }
  }

  /**
   * Gets the number of spaces this placement occupies
   */
  getSpaceCount(): number {
    switch (this.size) {
      case AdSize.SINGLE:
        return 1
      case AdSize.QUARTER:
        return 2
      case AdSize.HALF:
        return 4
      case AdSize.FULL:
        return 8
      default:
        return 1
    }
  }

  /**
   * Gets the end position for this placement
   */
  getEndPosition(): number {
    return this.position + this.getSpaceCount() - 1
  }

  /**
   * Checks if this placement overlaps with another position range
   */
  overlapsWithPositions(startPos: number, endPos: number): boolean {
    const placementEnd = this.getEndPosition()

    return !(endPos < this.position || startPos > placementEnd)
  }

  /**
   * Converts the entity to a plain object
   */
  toObject(): AdPlacementData {
    return {
      id: this.id,
      pageId: this.pageId,
      voucherId: this.voucherId,
      providerId: this.providerId,
      position: this.position,
      size: this.size,
      imageUrl: this.imageUrl,
      qrCodePayload: this.qrCodePayload,
      shortCode: this.shortCode,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
