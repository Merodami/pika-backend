import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
  FirestoreError,
  limit,
  onSnapshot,
  orderBy,
  OrderByDirection,
  query,
  QueryConstraint,
  where,
  WhereFilterOp,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { firestore } from '@/lib/firebase/config'

interface UseCollectionOptions {
  where?: Array<{
    field: string
    operator: WhereFilterOp
    value: any
  }>
  orderBy?: Array<{
    field: string
    direction?: OrderByDirection
  }>
  limit?: number
  enabled?: boolean
}

export function useCollection<T = DocumentData>(
  collectionName: string,
  options: UseCollectionOptions = {}
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FirestoreError | null>(null)

  useEffect(() => {
    if (options.enabled === false || !firestore) {
      setLoading(false)

      return () => {}
    }

    setLoading(true)
    setError(null)

    try {
      // Build query constraints
      const constraints: QueryConstraint[] = []

      // Add where clauses
      if (options.where) {
        options.where.forEach(({ field, operator, value }) => {
          constraints.push(where(field, operator, value))
        })
      }

      // Add orderBy clauses
      if (options.orderBy) {
        options.orderBy.forEach(({ field, direction = 'asc' }) => {
          constraints.push(orderBy(field, direction))
        })
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit))
      }

      // Create query
      const collectionRef = collection(
        firestore,
        collectionName
      ) as CollectionReference<T>
      const q = query(collectionRef, ...constraints)

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          })) as T[]

          setData(docs)
          setLoading(false)
        },
        (err) => {
          console.error('Firestore error:', err)
          setError(err)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Query setup error:', err)
      setError(err as FirestoreError)
      setLoading(false)

      return () => {}
    }
  }, [
    collectionName,
    JSON.stringify(options.where),
    JSON.stringify(options.orderBy),
    options.limit,
    options.enabled,
  ])

  return { data, loading, error }
}

export function useDocument<T = DocumentData>(
  collectionName: string,
  documentId: string | null,
  options: { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FirestoreError | null>(null)

  useEffect(() => {
    if (!documentId || options.enabled === false || !firestore) {
      setLoading(false)

      return () => {}
    }

    setLoading(true)
    setError(null)

    try {
      const docRef = doc(
        firestore,
        collectionName,
        documentId
      ) as DocumentReference<T>

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setData({
              id: snapshot.id,
              ...snapshot.data(),
            } as T)
          } else {
            setData(null)
          }
          setLoading(false)
        },
        (err) => {
          console.error('Firestore error:', err)
          setError(err)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Document subscription error:', err)
      setError(err as FirestoreError)
      setLoading(false)

      return () => {}
    }
  }, [collectionName, documentId, options.enabled])

  return { data, loading, error }
}
