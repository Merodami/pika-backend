import type { FraudCaseAction, FraudFlag } from '@pika/types-core'
import type { FraudCaseStatus } from '@prisma/client'

/**
 * Domain entity for fraud cases
 */
export class FraudCase {
  constructor(
    public readonly id: string,
    public readonly caseNumber: string,
    public readonly redemptionId: string,
    public readonly detectedAt: Date,
    public readonly riskScore: number,
    public readonly flags: FraudFlag[],
    public readonly customerId: string,
    public readonly providerId: string,
    public readonly voucherId: string,
    public status: FraudCaseStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly detectionMetadata?: Record<string, any>,
    public reviewedAt?: Date,
    public reviewedBy?: string,
    public reviewNotes?: string,
    public actionsTaken?: FraudCaseAction[],
  ) {}

  /**
   * Check if case needs urgent review
   */
  isUrgent(): boolean {
    return this.riskScore > 80 || this.flags.some((f) => f.severity === 'HIGH')
  }

  /**
   * Check if case is pending review
   */
  isPending(): boolean {
    return this.status === 'PENDING' || this.status === 'REVIEWING'
  }

  /**
   * Review the case
   */
  review(
    status: FraudCaseStatus,
    reviewerId: string,
    notes?: string,
    actions?: FraudCaseAction[],
  ): void {
    if (!this.isPending()) {
      throw new Error('Can only review pending cases')
    }

    this.status = status
    this.reviewedAt = new Date()
    this.reviewedBy = reviewerId
    this.reviewNotes = notes
    this.actionsTaken = actions
  }

  /**
   * Generate case number (FRAUD-YYYY-NNNN)
   */
  static generateCaseNumber(sequenceNumber: number): string {
    const year = new Date().getFullYear()
    const paddedNumber = sequenceNumber.toString().padStart(4, '0')

    return `FRAUD-${year}-${paddedNumber}`
  }
}
