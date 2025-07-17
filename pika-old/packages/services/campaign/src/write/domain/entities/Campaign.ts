import { ErrorFactory } from '@pika/shared'
import { CampaignStatus, MultilingualContent } from '@pika/types-core'

/**
 * Campaign WRITE Domain Entity
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
  public readonly createdAt: Date
  public readonly updatedAt: Date

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
    createdAt: Date
    updatedAt: Date
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

    this.validateInvariants()
  }

  // Factory methods
  static create(data: {
    name: MultilingualContent
    description: MultilingualContent
    startDate: Date
    endDate: Date
    budget: number
    status?: CampaignStatus
    providerId: string
    active?: boolean
    targetAudience?: MultilingualContent | null
    objectives?: MultilingualContent | null
  }): Campaign {
    const now = new Date()

    return new Campaign({
      id: '', // Will be assigned by persistence layer
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      status: data.status || CampaignStatus.DRAFT,
      providerId: data.providerId,
      active: data.active ?? true,
      targetAudience: data.targetAudience || null,
      objectives: data.objectives || null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(data: {
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
    createdAt: Date
    updatedAt: Date
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

  canBeActivated(): boolean {
    return !this.hasExpired() && this.status === CampaignStatus.DRAFT
  }

  canBePaused(): boolean {
    return this.status === CampaignStatus.ACTIVE
  }

  canBeCancelled(): boolean {
    return (
      this.status !== CampaignStatus.COMPLETED &&
      this.status !== CampaignStatus.CANCELLED
    )
  }

  canBeDeleted(): boolean {
    return this.status === CampaignStatus.DRAFT
  }

  getDaysRemaining(): number {
    const now = new Date()

    if (this.hasExpired()) return 0

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

  // State transition methods
  activate(): Campaign {
    if (!this.canBeActivated()) {
      throw ErrorFactory.validationError(
        { status: ['Campaign cannot be activated in current state'] },
        { source: 'Campaign.activate' },
      )
    }

    return Campaign.reconstitute({
      ...this,
      status: CampaignStatus.ACTIVE,
      active: true,
      updatedAt: new Date(),
    })
  }

  pause(): Campaign {
    if (!this.canBePaused()) {
      throw ErrorFactory.validationError(
        { status: ['Campaign cannot be paused in current state'] },
        { source: 'Campaign.pause' },
      )
    }

    return Campaign.reconstitute({
      ...this,
      status: CampaignStatus.PAUSED,
      updatedAt: new Date(),
    })
  }

  complete(): Campaign {
    return Campaign.reconstitute({
      ...this,
      status: CampaignStatus.COMPLETED,
      active: false,
      updatedAt: new Date(),
    })
  }

  cancel(): Campaign {
    if (!this.canBeCancelled()) {
      throw ErrorFactory.validationError(
        { status: ['Campaign cannot be cancelled in current state'] },
        { source: 'Campaign.cancel' },
      )
    }

    return Campaign.reconstitute({
      ...this,
      status: CampaignStatus.CANCELLED,
      active: false,
      updatedAt: new Date(),
    })
  }

  update(data: {
    name?: MultilingualContent
    description?: MultilingualContent
    startDate?: Date
    endDate?: Date
    budget?: number
    targetAudience?: MultilingualContent | null
    objectives?: MultilingualContent | null
  }): Campaign {
    // Merge multilingual fields to preserve existing languages
    const mergedName = data.name
      ? {
          ...this.name,
          ...data.name,
        }
      : this.name

    const mergedDescription = data.description
      ? {
          ...this.description,
          ...data.description,
        }
      : this.description

    const mergedTargetAudience =
      data.targetAudience !== undefined
        ? data.targetAudience
          ? {
              ...this.targetAudience,
              ...data.targetAudience,
            }
          : data.targetAudience
        : this.targetAudience

    const mergedObjectives =
      data.objectives !== undefined
        ? data.objectives
          ? {
              ...this.objectives,
              ...data.objectives,
            }
          : data.objectives
        : this.objectives

    const updated = Campaign.reconstitute({
      ...this,
      name: mergedName,
      description: mergedDescription,
      startDate: data.startDate || this.startDate,
      endDate: data.endDate || this.endDate,
      budget: data.budget ?? this.budget,
      targetAudience: mergedTargetAudience,
      objectives: mergedObjectives,
      updatedAt: new Date(),
    })

    // Validate after update
    updated.validateInvariants()

    return updated
  }

  // Validation
  private validateInvariants(): void {
    // Validate multilingual content
    if (!this.name || !this.name.en) {
      throw ErrorFactory.validationError(
        { name: ['English name is required'] },
        { source: 'Campaign.validateInvariants' },
      )
    }

    if (!this.description || !this.description.en) {
      throw ErrorFactory.validationError(
        { description: ['English description is required'] },
        { source: 'Campaign.validateInvariants' },
      )
    }

    // Validate dates
    if (this.startDate >= this.endDate) {
      throw ErrorFactory.validationError(
        { dates: ['Start date must be before end date'] },
        { source: 'Campaign.validateInvariants' },
      )
    }

    // Validate budget
    if (this.budget < 0) {
      throw ErrorFactory.validationError(
        { budget: ['Budget cannot be negative'] },
        { source: 'Campaign.validateInvariants' },
      )
    }

    // Validate provider
    if (!this.providerId) {
      throw ErrorFactory.validationError(
        { providerId: ['Provider ID is required'] },
        { source: 'Campaign.validateInvariants' },
      )
    }
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
