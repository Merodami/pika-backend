import type { Business, User, Category } from '@pika/database'

/**
 * Business domain interfaces
 */

export interface BusinessDomain {
  id: string
  userId: string
  businessNameKey: string
  businessDescriptionKey: string | null
  categoryId: string
  verified: boolean
  active: boolean
  avgRating: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  // Optional relations
  user?: UserDomain
  category?: CategoryDomain
}

export interface UserDomain {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
}

export interface CategoryDomain {
  id: string
  nameKey: string
  descriptionKey: string | null
  icon: string | null
  isActive: boolean
}

export interface CreateBusinessData {
  userId: string
  businessNameKey: string
  businessDescriptionKey?: string
  categoryId: string
  verified?: boolean
  active?: boolean
}

export interface UpdateBusinessData {
  businessNameKey?: string
  businessDescriptionKey?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}

export interface BusinessWithRelations extends Business {
  user?: User | null
  category?: Category | null
}