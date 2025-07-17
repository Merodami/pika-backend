import { ErrorFactory } from '@pika/shared'
import { VoucherBookStatus, VoucherBookType } from '@prisma/client'
import { v4 as uuid } from 'uuid'

/**
 * VoucherBook WRITE Domain Entity - Following Admin Service Gold Standard
 * Encapsulates business rules for voucher book management
 */

export interface VoucherBookProps {
  title: string
  edition: string | null
  bookType: VoucherBookType
  month: number | null
  year: number
  status: VoucherBookStatus
  totalPages: number
  coverImageUrl: string | null
  backImageUrl: string | null
  pdfUrl: string | null
  generatedAt: Date | null
  publishedAt: Date | null
  createdBy: string
  providerId: string | null
}

export interface VoucherBookData extends VoucherBookProps {
  id: string
  createdAt: Date | null
  updatedAt: Date | null
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
  public readonly pdfUrl: string | null
  public readonly generatedAt: Date | null
  public readonly publishedAt: Date | null
  public readonly createdBy: string
  public readonly providerId: string | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null

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
    this.pdfUrl = data.pdfUrl
    this.generatedAt = data.generatedAt
    this.publishedAt = data.publishedAt
    this.createdBy = data.createdBy
    this.providerId = data.providerId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    this.validateInvariants()
  }

  /**
   * Validates domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) throw new Error('VoucherBook ID is required')
    if (!this.title) throw new Error('VoucherBook title is required')
    if (!this.createdBy) throw new Error('VoucherBook createdBy is required')
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
   * Factory method for creating new VoucherBook
   */
  static create(props: VoucherBookProps): VoucherBook {
    return new VoucherBook({
      id: uuid(),
      ...props,
      status: props.status || VoucherBookStatus.DRAFT,
      totalPages: props.totalPages || 24,
      generatedAt: null,
      publishedAt: null,
      pdfUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Factory method for reconstituting VoucherBook from persistence
   */
  static reconstitute(data: VoucherBookData): VoucherBook {
    return new VoucherBook(data)
  }

  /**
   * Business behaviors
   */
  isDraft(): boolean {
    return this.status === VoucherBookStatus.DRAFT
  }

  isReadyForPrint(): boolean {
    return this.status === VoucherBookStatus.READY_FOR_PRINT
  }

  isPublished(): boolean {
    return this.status === VoucherBookStatus.PUBLISHED
  }

  isArchived(): boolean {
    return this.status === VoucherBookStatus.ARCHIVED
  }

  canBeEdited(): boolean {
    return this.status === VoucherBookStatus.DRAFT
  }

  /**
   * Marks the book as ready for print
   */
  markAsReadyForPrint(): VoucherBook {
    if (!this.canBeEdited()) {
      throw ErrorFactory.validationError(
        { status: ['Only draft books can be marked as ready for print'] },
        { source: 'VoucherBook.markAsReadyForPrint' },
      )
    }

    return new VoucherBook({
      ...this.toObject(),
      status: VoucherBookStatus.READY_FOR_PRINT,
      updatedAt: new Date(),
    })
  }

  /**
   * Publishes the book with a PDF URL
   */
  publish(pdfUrl: string): VoucherBook {
    if (this.status !== VoucherBookStatus.READY_FOR_PRINT) {
      throw ErrorFactory.validationError(
        { status: ['Only books ready for print can be published'] },
        { source: 'VoucherBook.publish' },
      )
    }

    if (!pdfUrl) {
      throw ErrorFactory.validationError(
        { pdfUrl: ['PDF URL is required for publishing'] },
        { source: 'VoucherBook.publish' },
      )
    }

    return new VoucherBook({
      ...this.toObject(),
      status: VoucherBookStatus.PUBLISHED,
      pdfUrl: pdfUrl,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Archives the book
   */
  archive(): VoucherBook {
    if (this.status !== VoucherBookStatus.PUBLISHED) {
      throw ErrorFactory.validationError(
        { status: ['Only published books can be archived'] },
        { source: 'VoucherBook.archive' },
      )
    }

    return new VoucherBook({
      ...this.toObject(),
      status: VoucherBookStatus.ARCHIVED,
      updatedAt: new Date(),
    })
  }

  /**
   * Updates the book properties
   */
  update(updates: Partial<VoucherBookProps>): VoucherBook {
    if (!this.canBeEdited()) {
      throw ErrorFactory.validationError(
        { status: ['Only draft books can be updated'] },
        { source: 'VoucherBook.update' },
      )
    }

    return new VoucherBook({
      ...this.toObject(),
      title: updates.title !== undefined ? updates.title : this.title,
      edition: updates.edition !== undefined ? updates.edition : this.edition,
      bookType:
        updates.bookType !== undefined ? updates.bookType : this.bookType,
      month: updates.month !== undefined ? updates.month : this.month,
      year: updates.year !== undefined ? updates.year : this.year,
      totalPages:
        updates.totalPages !== undefined ? updates.totalPages : this.totalPages,
      coverImageUrl:
        updates.coverImageUrl !== undefined
          ? updates.coverImageUrl
          : this.coverImageUrl,
      backImageUrl:
        updates.backImageUrl !== undefined
          ? updates.backImageUrl
          : this.backImageUrl,
      updatedAt: new Date(),
    })
  }

  /**
   * Sets the PDF generation date
   */
  setGeneratedAt(date: Date): VoucherBook {
    return new VoucherBook({
      ...this.toObject(),
      generatedAt: date,
      updatedAt: new Date(),
    })
  }

  /**
   * Checks if the book has a PDF
   */
  hasPDF(): boolean {
    return this.pdfUrl !== null && this.generatedAt !== null
  }

  /**
   * Gets the display name for the book
   */
  getDisplayName(): string {
    return this.edition ? `${this.title} - ${this.edition}` : this.title
  }

  /**
   * Gets the display period for the book
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
   * Serialize aggregate to plain object for persistence
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
      pdfUrl: this.pdfUrl,
      generatedAt: this.generatedAt,
      publishedAt: this.publishedAt,
      createdBy: this.createdBy,
      providerId: this.providerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
