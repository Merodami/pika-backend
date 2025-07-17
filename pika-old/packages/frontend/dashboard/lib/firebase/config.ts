import { Analytics, getAnalytics, isSupported } from 'firebase/analytics'
import { FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth'
import { Database, getDatabase } from 'firebase/database'
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
} from 'firebase/firestore'
import { FirebaseStorage, getStorage } from 'firebase/storage'

import { logger } from '@/lib/utils/logger'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process?.env?.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process?.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process?.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process?.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:
    process?.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process?.env?.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process?.env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: process?.env?.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
}

// Check if Firebase configuration is available
const isFirebaseConfigured = () =>
  !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  )

// Initialize Firebase
let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null
let database: Database | null = null
let storage: FirebaseStorage | null = null
let analytics: Analytics | null = null

// Only initialize Firebase if configuration is available
if (isFirebaseConfigured()) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    // Initialize services
    auth = getAuth(app)
    firestore = getFirestore(app)
    database = getDatabase(app)
    storage = getStorage(app)

    // Configure emulator in development (only in browser to avoid SSR issues)
    if (
      process?.env?.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true' &&
      typeof window !== 'undefined'
    ) {
      try {
        // Connect to Auth emulator
        if (process?.env?.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST && auth) {
          connectAuthEmulator(
            auth,
            `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`,
            {
              disableWarnings: true,
            }
          )
        }

        // Connect to Firestore emulator
        if (
          process?.env?.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST &&
          firestore
        ) {
          const [host, port] =
            process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST.split(':')

          connectFirestoreEmulator(firestore, host, parseInt(port))
        }

        logger.info('✅ Firebase emulators connected')
      } catch {
        // Emulators might already be connected, which is fine
        logger.info(
          'Firebase emulators connection skipped (likely already connected)'
        )
      }
    }

    // Initialize Analytics (only in browser and not in emulator mode)
    if (
      typeof window !== 'undefined' &&
      process?.env?.NEXT_PUBLIC_FIREBASE_USE_EMULATOR !== 'true'
    ) {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app)
        }
      })
    }
  } catch (error) {
    logger.error('Firebase initialization failed:', error)
  }
} else {
  logger.warn(
    'Firebase configuration incomplete. Firebase features will be disabled.'
  )
}

export { analytics, app, auth, database, firestore, storage }

// Export types for use in other files
export type {
  Analytics,
  Auth,
  Database,
  FirebaseApp,
  FirebaseStorage,
  Firestore,
}
