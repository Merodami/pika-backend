// Category DTOs for write operations

export type CategoryCreateDTO = {
  name: Record<string, string>
  description: Record<string, string>
  iconUrl?: string
  slug: string
  parentId?: string
  active?: boolean
  sortOrder?: number
}

export type CategoryUpdateDTO = {
  name?: Record<string, string>
  description?: Record<string, string>
  iconUrl?: string
  slug?: string
  parentId?: string
  active?: boolean
  sortOrder?: number
}
