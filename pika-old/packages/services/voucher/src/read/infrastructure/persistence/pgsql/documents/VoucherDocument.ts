/**
 * Represents the database structure of a Voucher
 * Maps to the Prisma schema for the Voucher model
 */
export type VoucherDocument = {
  id: string
  provider_id: string
  category_id: string
  state: string
  title: Record<string, string> // Multilingual title field
  description: Record<string, string> // Multilingual description field
  terms: Record<string, string> // Multilingual terms field
  discount_type: string
  discount_value: number
  currency: string
  location: any // PostGIS geometry
  image_url: string | null
  valid_from: Date
  expires_at: Date
  max_redemptions: number | null
  max_redemptions_per_user: number
  current_redemptions: number
  metadata: any | null
  created_at: Date
  updated_at: Date
  // Nested relations
  codes?: VoucherCodeDocument[]
}

export type VoucherCodeDocument = {
  id: string
  voucher_id: string
  code: string
  type: string
  is_active: boolean
  metadata: any | null
}
