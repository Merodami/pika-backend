import { getEnvVariable } from '../getEnvVariable.js'

export const ENABLE_REVIEWS = getEnvVariable(
  'ENABLE_REVIEWS',
  (v) => v === 'true',
  true,
)
export const ENABLE_CHAT = getEnvVariable(
  'ENABLE_CHAT',
  (v) => v === 'true',
  false,
)
export const ENABLE_PROVIDER_VERIFICATION = getEnvVariable(
  'ENABLE_PROVIDER_VERIFICATION',
  (v) => v === 'true',
  true,
)
export const MAINTENANCE_MODE = getEnvVariable(
  'MAINTENANCE_MODE',
  (v) => v === 'true',
  false,
)
