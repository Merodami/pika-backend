import { FirebaseAdminClient } from '@pika/shared'
import type { Firestore } from 'firebase-admin/firestore'
import { afterAll, beforeAll } from 'vitest'

export interface FirebaseTestContext {
  firestore: Firestore
  clearFirestore: () => Promise<void>
}

/**
 * Setup Firebase emulator for E2E tests
 * This ensures we're using the emulator and provides helper functions
 */
export function setupFirebaseEmulator(): FirebaseTestContext {
  let firestore: Firestore

  beforeAll(() => {
    // Get Firebase instance (it will use emulator settings)
    const admin = FirebaseAdminClient.getInstance()

    firestore = admin.firestore
  })

  afterAll(async () => {
    // Optional: Clear all data after tests
    // await clearFirestore();
  })

  const clearFirestore = async () => {
    const batch = firestore.batch()

    // Delete all documents in all collections
    const collections = ['conversations', 'users']

    for (const collectionName of collections) {
      const snapshot = await firestore.collection(collectionName).get()

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)

        // Also delete subcollections if needed
        if (collectionName === 'conversations') {
          // Messages subcollection will be deleted with the conversation
        }
      })
    }

    await batch.commit()
  }

  return {
    get firestore() {
      return firestore
    },
    clearFirestore,
  }
}
