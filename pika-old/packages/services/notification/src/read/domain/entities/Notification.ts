export interface NotificationRead {
  id: string
  userId: string
  type: string
  title: string
  body: string
  icon?: string
  entityRef?: {
    entityType: string
    entityId: string
  }
  read: boolean
  createdAt: Date
  expiresAt?: Date
}
