import {
  AdminPermission,
  AdminRole,
  AdminStatus,
} from '@admin-read/domain/entities/Admin.js'

/**
 * Represents the database structure of an Admin
 * Maps to the Prisma schema for the Admin model
 */
export type AdminDocument = {
  id: string
  user_id: string
  role: AdminRole
  permissions: AdminPermission[]
  status: AdminStatus
  name: Record<string, string> // Multilingual name field
  email: string
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
  created_by: string | null
  metadata: Record<string, any> | null
}
