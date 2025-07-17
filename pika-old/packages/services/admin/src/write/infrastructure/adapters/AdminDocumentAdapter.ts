import { type AdminDocument as LocalAdminDocument } from '@admin-write/domain/entities/Admin.js'
import { type AdminDocument as SDKAdminDocument } from '@pika/sdk'
import { type MultilingualContent } from '@pika/types-core'

/**
 * Adapter to convert between local AdminDocument (with name: MultilingualContent)
 * and SDK AdminDocument (with firstName, lastName, profileData)
 */
export class AdminDocumentAdapter {
  /**
   * Convert SDK AdminDocument to local AdminDocument format
   */
  static fromSDK(sdkDoc: Partial<SDKAdminDocument>): Partial<LocalAdminDocument> {
    const result: Partial<LocalAdminDocument> = {}

    // Map basic fields
    if (sdkDoc.id !== undefined) result.id = sdkDoc.id
    if (sdkDoc.userId !== undefined) result.userId = sdkDoc.userId
    if (sdkDoc.email !== undefined) result.email = sdkDoc.email
    if (sdkDoc.role !== undefined) result.role = sdkDoc.role as any // Will be validated later
    if (sdkDoc.permissions !== undefined) result.permissions = sdkDoc.permissions as any[]
    if (sdkDoc.status !== undefined) result.status = sdkDoc.status as any
    if (sdkDoc.lastLoginAt !== undefined) result.lastLoginAt = sdkDoc.lastLoginAt
    if (sdkDoc.createdAt !== undefined) result.createdAt = sdkDoc.createdAt
    if (sdkDoc.updatedAt !== undefined) result.updatedAt = sdkDoc.updatedAt
    if (sdkDoc.metadata !== undefined) result.metadata = sdkDoc.metadata

    // Convert firstName/lastName to multilingual name
    if (sdkDoc.firstName !== undefined || sdkDoc.lastName !== undefined) {
      const fullName = `${sdkDoc.firstName || ''} ${sdkDoc.lastName || ''}`.trim()

      result.name = {
        en: fullName,
        es: fullName,
        gn: fullName,
      } as MultilingualContent
    }

    return result
  }

  /**
   * Convert local AdminDocument to SDK AdminDocument format
   */
  static toSDK(localDoc: LocalAdminDocument): SDKAdminDocument {
    // Extract name from multilingual content
    const nameEn = typeof localDoc.name === 'object' ? (localDoc.name.en || '') : ''
    const nameParts = nameEn.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return {
      id: localDoc.id,
      userId: localDoc.userId,
      email: localDoc.email,
      firstName,
      lastName,
      role: localDoc.role,
      permissions: localDoc.permissions || [],
      status: localDoc.status,
      lastLoginAt: localDoc.lastLoginAt,
      metadata: localDoc.metadata || {},
      profileData: {
        bio: {
          en: '',
          es: '',
          gn: '',
        },
        phone: null,
        timezone: 'UTC',
        language: 'en',
        avatarUrl: null,
      },
      createdAt: localDoc.createdAt || null,
      updatedAt: localDoc.updatedAt || null,
    }
  }
}