import { DEFAULT_LANGUAGE } from '@pika/environment'
import { CampaignStatus, MultilingualContent } from '@pika/types-core'

/**
 * Campaign READ Domain Entity
 * Following Admin Service Gold Standard pattern
 */
export class Campaign {
  public readonly id: string
  public readonly name: MultilingualContent
  public readonly description: MultilingualContent
  public readonly startDate: Date
  public readonly endDate: Date
  public readonly budget: number
  public readonly status: CampaignStatus
  public readonly providerId: string
  public readonly active: boolean
  public readonly targetAudience: MultilingualContent | null
  public readonly objectives: MultilingualContent | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null

  private constructor(data: {
    id: string
    name: MultilingualContent
    description: MultilingualContent
    startDate: Date
    endDate: Date
    budget: number
    status: CampaignStatus
    providerId: string
    active: boolean
    targetAudience: MultilingualContent | null
    objectives: MultilingualContent | null
    createdAt: Date | null
    updatedAt: Date | null
  }) {
    this.id = data.id
    this.name = data.name
    this.description = data.description
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.budget = data.budget
    this.status = data.status
    this.providerId = data.providerId
    this.active = data.active
    this.targetAudience = data.targetAudience
    this.objectives = data.objectives
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // Factory method
  static create(data: {
    id: string
    name: MultilingualContent
    description: MultilingualContent
    startDate: Date
    endDate: Date
    budget: number
    status: CampaignStatus
    providerId: string
    active: boolean
    targetAudience: MultilingualContent | null
    objectives: MultilingualContent | null
    createdAt: Date | null
    updatedAt: Date | null
  }): Campaign {
    return new Campaign(data)
  }

  // Business methods
  isCurrentlyActive(): boolean {
    const now = new Date()

    return (
      this.active &&
      this.status === CampaignStatus.ACTIVE &&
      now >= this.startDate &&
      now <= this.endDate
    )
  }

  hasExpired(): boolean {
    const now = new Date()

    return now > this.endDate
  }

  hasStarted(): boolean {
    const now = new Date()

    return now >= this.startDate
  }

  isUpcoming(): boolean {
    const now = new Date()

    return now < this.startDate
  }

  isPaused(): boolean {
    return this.status === CampaignStatus.PAUSED
  }

  isCompleted(): boolean {
    return this.status === CampaignStatus.COMPLETED
  }

  isCancelled(): boolean {
    return this.status === CampaignStatus.CANCELLED
  }

  isDraft(): boolean {
    return this.status === CampaignStatus.DRAFT
  }

  getDaysRemaining(): number {
    const now = new Date()

    if (this.hasExpired()) return 0
    if (!this.hasStarted()) {
      return Math.ceil(
        (this.endDate.getTime() - this.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    }

    return Math.ceil(
      (this.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
  }

  getDuration(): number {
    return Math.ceil(
      (this.endDate.getTime() - this.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    )
  }

  getBudgetPerDay(): number {
    const duration = this.getDuration()

    return duration > 0 ? this.budget / duration : 0
  }

  getLocalizedName(lang: string = DEFAULT_LANGUAGE): string {
    return (
      this.name[lang as keyof MultilingualContent] ||
      this.name.en ||
      this.name.es ||
      ''
    )
  }

  getLocalizedDescription(lang: string = DEFAULT_LANGUAGE): string {
    return (
      this.description[lang as keyof MultilingualContent] ||
      this.description.en ||
      this.description.es ||
      ''
    )
  }

  getLocalizedTargetAudience(lang: string = DEFAULT_LANGUAGE): string | null {
    if (!this.targetAudience) return null

    return (
      this.targetAudience[lang as keyof MultilingualContent] ||
      this.targetAudience.en ||
      this.targetAudience.es ||
      ''
    )
  }

  getLocalizedObjectives(lang: string = DEFAULT_LANGUAGE): string | null {
    if (!this.objectives) return null

    return (
      this.objectives[lang as keyof MultilingualContent] ||
      this.objectives.en ||
      this.objectives.es ||
      ''
    )
  }

  // For persistence and debugging
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      budget: this.budget,
      status: this.status,
      providerId: this.providerId,
      active: this.active,
      targetAudience: this.targetAudience,
      objectives: this.objectives,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
