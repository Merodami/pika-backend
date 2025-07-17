/**
 * Represents the database structure of a Campaign
 * Maps to the Prisma schema for the Campaign model
 */
export type CampaignDocument = {
  id: string
  name: Record<string, string> // Multilingual name field
  description: Record<string, string> // Multilingual description field
  start_date: Date
  end_date: Date
  budget: number
  status: string
  provider_id: string
  active: boolean
  created_at: Date
  updated_at: Date
}
