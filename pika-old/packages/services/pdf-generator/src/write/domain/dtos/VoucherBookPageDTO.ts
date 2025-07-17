// Page-specific DTOs
export interface VoucherBookPageCreateDTO {
  pageNumber: number
  layoutType?: 'STANDARD' | 'CUSTOM'
  metadata?: Record<string, any>
}

export interface VoucherBookPageUpdateDTO {
  layoutType?: 'STANDARD' | 'CUSTOM'
  metadata?: Record<string, any>
}

// Ad placement DTOs
export interface AdPlacementCreateDTO {
  pageId: string
  position: number
  size: 'SINGLE' | 'QUARTER' | 'HALF' | 'FULL'
  contentType: 'VOUCHER' | 'IMAGE' | 'AD' | 'SPONSORED'
  voucherId?: string
  providerId?: string
  imageUrl?: string
  qrCodePayload?: string
  shortCode?: string
  title?: string
  description?: string
  metadata?: Record<string, any>
}

export interface AdPlacementUpdateDTO {
  position?: number
  size?: 'SINGLE' | 'QUARTER' | 'HALF' | 'FULL'
  contentType?: 'VOUCHER' | 'IMAGE' | 'AD' | 'SPONSORED'
  voucherId?: string
  providerId?: string
  imageUrl?: string
  qrCodePayload?: string
  shortCode?: string
  title?: string
  description?: string
  metadata?: Record<string, any>
}
