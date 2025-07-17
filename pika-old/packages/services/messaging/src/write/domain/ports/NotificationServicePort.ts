export interface NotificationServicePort {
  notifyNewMessage(params: {
    recipientId: string
    senderId: string
    conversationId: string
    messageId: string
    content: string
  }): Promise<void>
}
