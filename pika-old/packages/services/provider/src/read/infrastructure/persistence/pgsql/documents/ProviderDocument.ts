/**
 * Represents the database structure of a Provider
 * Maps to the Prisma schema for the ServiceProvider model
 */
export type ProviderDocument = {
  id: string
  user_id: string
  business_name: Record<string, string> // Multilingual business name
  business_description: Record<string, string> // Multilingual business description
  category_id: string
  verified: boolean
  active: boolean
  avg_rating: number | null
  created_at: Date | null
  updated_at: Date | null
  deleted_at: Date | null
}
