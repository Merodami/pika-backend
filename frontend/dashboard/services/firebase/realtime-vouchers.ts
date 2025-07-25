import {
  collection,
  doc,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'

import { firestore } from '@/lib/firebase/config'

export interface VoucherUpdate {
  id: string
  voucherId: string
  businessId: string
  type: 'created' | 'updated' | 'claimed' | 'redeemed' | 'expired'
  timestamp: Timestamp
  metadata?: {
    customerId?: string
    customerName?: string
    redemptionCode?: string
    location?: {
      lat: number
      lng: number
    }
  }
}

export interface VoucherStats {
  totalVouchers: number
  activeVouchers: number
  claimedToday: number
  redeemedToday: number
  conversionRate: number
}

class RealtimeVoucherService {
  private statsUnsubscribe: (() => void) | null = null
  private updatesUnsubscribe: (() => void) | null = null

  /**
   * Subscribe to real-time voucher statistics for a business
   */
  subscribeToStats(
    businessId: string,
    onUpdate: (stats: VoucherStats) => void
  ) {
    // Check if firestore is available
    if (!firestore) {
      console.error('Firestore not initialized')

      return () => {}
    }

    // Unsubscribe from existing listener
    if (this.statsUnsubscribe) {
      this.statsUnsubscribe()
    }

    const statsRef = doc(firestore, 'voucherStats', businessId)

    this.statsUnsubscribe = onSnapshot(
      statsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as VoucherStats

          onUpdate(data)
        } else {
          // Default stats if document doesn't exist
          onUpdate({
            totalVouchers: 0,
            activeVouchers: 0,
            claimedToday: 0,
            redeemedToday: 0,
            conversionRate: 0,
          })
        }
      },
      (error) => {
        console.error('Error listening to voucher stats:', error)
      }
    )

    return () => {
      if (this.statsUnsubscribe) {
        this.statsUnsubscribe()
        this.statsUnsubscribe = null
      }
    }
  }

  /**
   * Subscribe to real-time voucher updates for a business
   */
  subscribeToUpdates(
    businessId: string,
    onUpdate: (updates: VoucherUpdate[]) => void,
    limit: number = 50
  ) {
    // Check if firestore is available
    if (!firestore) {
      console.error('Firestore not initialized')

      return () => {}
    }

    // Unsubscribe from existing listener
    if (this.updatesUnsubscribe) {
      this.updatesUnsubscribe()
    }

    const updatesRef = collection(firestore, 'voucherUpdates')
    const q = query(
      updatesRef,
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    )

    this.updatesUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updates = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })) as VoucherUpdate[]

        onUpdate(updates)
      },
      (error) => {
        console.error('Error listening to voucher updates:', error)
      }
    )

    return () => {
      if (this.updatesUnsubscribe) {
        this.updatesUnsubscribe()
        this.updatesUnsubscribe = null
      }
    }
  }

  /**
   * Subscribe to real-time updates for a specific voucher
   */
  subscribeToVoucher(voucherId: string, onUpdate: (voucher: any) => void) {
    // Check if firestore is available
    if (!firestore) {
      console.error('Firestore not initialized')

      return () => {}
    }

    const voucherRef = doc(firestore, 'vouchers', voucherId)

    const unsubscribe = onSnapshot(
      voucherRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate({
            id: snapshot.id,
            ...snapshot.data(),
          })
        }
      },
      (error) => {
        console.error('Error listening to voucher:', error)
      }
    )

    return unsubscribe
  }

  /**
   * Clean up all subscriptions
   */
  unsubscribeAll() {
    if (this.statsUnsubscribe) {
      this.statsUnsubscribe()
      this.statsUnsubscribe = null
    }
    if (this.updatesUnsubscribe) {
      this.updatesUnsubscribe()
      this.updatesUnsubscribe = null
    }
  }
}

// Export singleton instance
export const realtimeVoucherService = new RealtimeVoucherService()
