import { FIREBASE_CONFIG, FIREBASE_EMULATOR_CONFIG } from '@pika/environment'
import admin from 'firebase-admin'

import { logger } from '../infrastructure/logger/index.js'

export class FirebaseAdminClient {
  private static instance: FirebaseAdminClient
  private readonly app: admin.app.App

  private constructor() {
    const isEmulator = FIREBASE_EMULATOR_CONFIG.useEmulator

    // Check if default app already exists
    try {
      this.app = admin.app()
      logger.info('Using existing Firebase Admin app')

      return
    } catch {
      // App doesn't exist, proceed with initialization
    }

    if (isEmulator) {
      logger.info('Initializing Firebase Admin in emulator mode')

      // For emulator, we don't need real credentials
      this.app = admin.initializeApp({
        projectId: FIREBASE_CONFIG.projectId || 'pika-demo',
      })

      // Configure Firestore emulator
      const db = this.app.firestore()

      db.settings({
        host: `${FIREBASE_EMULATOR_CONFIG.host}:${FIREBASE_EMULATOR_CONFIG.firestorePort}`,
        ssl: false,
      })

      logger.info('Firebase Admin initialized with emulator settings')
    } else {
      logger.info('Initializing Firebase Admin with production settings')

      if (
        !FIREBASE_CONFIG.projectId ||
        !FIREBASE_CONFIG.privateKey ||
        !FIREBASE_CONFIG.clientEmail
      ) {
        throw new Error('Missing required Firebase configuration')
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_CONFIG.projectId,
          privateKey: FIREBASE_CONFIG.privateKey.replace(/\\n/g, '\n'),
          clientEmail: FIREBASE_CONFIG.clientEmail,
        }),
        databaseURL: FIREBASE_CONFIG.databaseUrl,
        storageBucket: FIREBASE_CONFIG.storageBucket,
      })

      logger.info('Firebase Admin initialized with production settings')
    }
  }

  static getInstance(): FirebaseAdminClient {
    if (!FirebaseAdminClient.instance) {
      FirebaseAdminClient.instance = new FirebaseAdminClient()
    }

    return FirebaseAdminClient.instance
  }

  get firestore(): admin.firestore.Firestore {
    return this.app.firestore()
  }

  get messaging(): admin.messaging.Messaging {
    return this.app.messaging()
  }

  get auth(): admin.auth.Auth {
    return this.app.auth()
  }

  get storage(): admin.storage.Storage {
    return this.app.storage()
  }

  // For testing purposes - allows resetting the singleton
  static reset(): void {
    if (FirebaseAdminClient.instance?.app) {
      try {
        FirebaseAdminClient.instance.app.delete()
      } catch {
        // Ignore errors when deleting
      }
    }
    FirebaseAdminClient.instance = undefined as any
  }
}
