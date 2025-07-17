import { FIREBASE_EMULATOR_CONFIG } from '@pika/environment'
import { FirebaseAdminClient, logger } from '@pika/shared'
import * as admin from 'firebase-admin'
import { MulticastMessage } from 'firebase-admin/messaging'
import { get } from 'lodash-es'

import {
  PushNotificationPayload,
  PushNotificationResult,
} from '../../domain/types/PushNotification.js'

export class PushNotificationService {
  private _messaging?: admin.messaging.Messaging

  private get messaging() {
    if (!this._messaging) {
      const firebaseClient = FirebaseAdminClient.getInstance()

      this._messaging = firebaseClient.messaging
    }

    return this._messaging
  }

  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, failedTokens: [] }
    }

    // Skip actual FCM sending in test environment
    if (FIREBASE_EMULATOR_CONFIG.useEmulator) {
      logger.info('Skipping FCM send in emulator environment', {
        tokenCount: tokens.length,
        title: payload.title,
        useEmulator: FIREBASE_EMULATOR_CONFIG.useEmulator,
      })

      return {
        successCount: tokens.length,
        failureCount: 0,
        failedTokens: [],
      }
    }

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high' as const,
        notification: {
          icon: payload.icon || 'ic_notification',
          sound: payload.sound || 'default',
          clickAction: payload.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: payload.badge || 1,
            sound: payload.sound || 'default',
            alert: {
              title: payload.title,
              body: payload.body,
            },
          },
        },
      },
    }

    try {
      const response = await this.messaging.sendEachForMulticast(message)

      const failedTokens: string[] = []

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = get(tokens, idx)

          if (!token) {
            return
          }

          failedTokens.push(token)
          logger.warn('Failed to send notification to token', {
            token,
            error: resp.error?.message,
          })
        }
      })

      logger.info('Push notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      })

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      }
    } catch (error) {
      logger.error('Error sending push notification', error)
      throw error
    }
  }
}
