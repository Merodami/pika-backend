import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    sync?: boolean // Sync across tabs
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
  }
) {
  const serialize = options?.serialize || JSON.stringify
  const deserialize = options?.deserialize || JSON.parse

  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)

      return item ? deserialize(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)

      return initialValue
    }
  }, [initialValue, key, deserialize])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value

        // Save to local state
        setStoredValue(valueToStore)

        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore))

          // Dispatch storage event for cross-tab sync
          if (options?.sync) {
            window.dispatchEvent(
              new StorageEvent('storage', {
                key,
                newValue: serialize(valueToStore),
                url: window.location.href,
                storageArea: window.localStorage,
              })
            )
          }
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, serialize, storedValue, options?.sync]
  )

  // Listen for changes across tabs
  useEffect(() => {
    if (!options?.sync) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue))
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize, options?.sync])

  return [storedValue, setValue] as const
}
