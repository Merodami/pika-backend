import { getEnvVariable } from '../getEnvVariable.js'
import { CATEGORY_API_URL } from './apiUrls.js'

export const FRONTEND_CUSTOMER_PORT = getEnvVariable(
  'FRONTEND_CUSTOMER_PORT',
  Number,
  3001,
)

export const FRONTEND_CUSTOMER_API_URL = getEnvVariable(
  'FRONTEND_CUSTOMER_API_URL',
  String,
  CATEGORY_API_URL,
)
