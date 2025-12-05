import type { VoucherDomain } from '@pika/sdk'
import type {
  DeepLinkPlatformType,
  VoucherScanSourceType,
  VoucherValidationCodeTypeType,
} from '@pika/types'

/**
 * Validation-specific types for URL-based QR codes
 * Following domain type organization patterns
 */

// ============= Validation Code Types =============

export interface ValidationCodeOptions {
  voucherId: string
  type?: VoucherValidationCodeTypeType
  ttl?: number // TTL in seconds
  campaign?: string // For tracking marketing campaigns
  metadata?: Record<string, any>
}

export interface ValidationCodeData {
  voucherId: string
  code: string
  type: VoucherValidationCodeTypeType
  expiresAt: Date
  campaign?: string
  metadata?: Record<string, any>
}

export interface ValidationRequest {
  voucherId: string
  code: string
  userId?: string
  location?: {
    lat: number
    lng: number
  }
  deviceInfo?: {
    platform: DeepLinkPlatformType
    appVersion?: string
    deviceId?: string
  }
  source?: VoucherScanSourceType
}

export interface ValidationResult {
  valid: boolean
  voucher?: VoucherDomain
  message?: string
  canRedeem: boolean
  expiresAt?: Date
  remainingUses?: number
}

// ============= Repository Types =============

export interface CreateValidationCodeData {
  voucherId: string
  code: string
  type: VoucherValidationCodeTypeType
  expiresAt: Date
  metadata?: Record<string, any>
}

export interface ValidationCodeRecord {
  id: string
  voucherId: string
  code: string
  type: VoucherValidationCodeTypeType
  expiresAt: Date
  usedAt: Date | null
  usedBy: string | null
  createdAt: Date
  metadata?: Record<string, any>
}

export interface ValidationAttemptData {
  voucherId: string
  userId?: string
  location?: { lat: number; lng: number }
  deviceInfo?: {
    platform: DeepLinkPlatformType
    appVersion?: string
    deviceId?: string
  }
  source?: VoucherScanSourceType
  timestamp: Date
}

// ============= Service Interface =============

export interface IVoucherValidationService {
  generateValidationCode(options: ValidationCodeOptions): Promise<string>
  validateCode(request: ValidationRequest): Promise<ValidationResult>
  markCodeUsed(code: string, userId: string): Promise<void>
  cleanupExpiredCodes(): Promise<number>
  getValidationCodeInfo(code: string): Promise<ValidationCodeRecord | null>
}
