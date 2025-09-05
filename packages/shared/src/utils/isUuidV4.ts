import { validate as uuidValidate, version as uuidVersion } from 'uuid'

// Legacy function name kept for compatibility, but now accepts any valid UUID
export function isUuidV4(id: string): boolean {
  return uuidValidate(id)
}

// New explicit function for UUID validation
export function isValidUuid(id: string): boolean {
  return uuidValidate(id)
}

// Function to check specifically for UUID v4 if needed
export function isStrictUuidV4(id: string): boolean {
  return uuidValidate(id) && uuidVersion(id) === 4
}
