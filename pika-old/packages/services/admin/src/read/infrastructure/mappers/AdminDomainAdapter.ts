import { Admin } from '@admin-read/domain/entities/Admin.js'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import { type AdminDomain } from '@pika/sdk'

/**
 * Adapter to convert Admin entity to AdminDomain interface expected by AdminMapper
 * This bridges the gap between the service's domain model and the SDK's expectations
 */
export class AdminDomainAdapter {
  /**
   * Convert Admin entity to AdminDomain interface
   */
  static toDomain(admin: Admin): AdminDomain {
    // Extract first and last name from the multilingual name
    const displayName = admin.getDisplayName(DEFAULT_LANGUAGE)
    const nameParts = displayName.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return {
      id: admin.id,
      userId: admin.userId,
      email: admin.email,
      firstName,
      lastName,
      role: admin.role,
      permissions: admin.permissions,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      metadata: admin.metadata || {},
      profileData: {
        bio: {
          en: '',
          es: '',
          gn: '',
          pt: '',
        },
        phone: null,
        timezone: 'America/Asuncion',
        language: DEFAULT_LANGUAGE,
        avatarUrl: admin.metadata?.avatarUrl || null,
      },
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }
  }

  /**
   * Convert array of Admin entities to AdminDomain array
   */
  static toDomainArray(admins: Admin[]): AdminDomain[] {
    return admins.map((admin) => AdminDomainAdapter.toDomain(admin))
  }
}
