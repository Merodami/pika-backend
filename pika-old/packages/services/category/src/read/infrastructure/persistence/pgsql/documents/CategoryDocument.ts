/**
 * Represents the database structure of a Category
 * Maps to the Prisma schema for the Category model
 */
export type CategoryDocument = {
  id: string
  name: Record<string, string> // Multilingual name field
  description: Record<string, string> // Multilingual description field
  icon_url: string | null
  slug: string
  parent_id: string | null
  level: number
  path: string
  active: boolean
  sort_order: number
  created_at: Date
  updated_at: Date
  // Nested relations
  children?: CategoryDocument[]
}
