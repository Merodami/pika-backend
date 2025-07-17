// Admin DTOs for write operations

import { AdminPermission, AdminRole, AdminStatus } from '../entities/Admin.js'

export type AdminCreateDTO = {
  userId: string
  role: AdminRole
  permissions?: AdminPermission[]
  name: Record<string, string>
  email: string
  createdBy?: string
  metadata?: Record<string, any>
}

export type AdminUpdateDTO = {
  role?: AdminRole
  permissions?: AdminPermission[]
  status?: AdminStatus
  name?: Record<string, string>
  email?: string
  metadata?: Record<string, any>
}
