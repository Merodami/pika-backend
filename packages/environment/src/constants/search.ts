import { getEnvVariable } from '../getEnvVariable.js'

export const POPULAR_SEARCHES_LIMIT = getEnvVariable(
  'POPULAR_SEARCHES_LIMIT',
  Number,
  8,
)