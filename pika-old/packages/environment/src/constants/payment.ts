import { getEnvVariable } from '../getEnvVariable.js'

export const BANCARD_PUBLIC_KEY = getEnvVariable('BANCARD_PUBLIC_KEY', String)
export const BANCARD_PRIVATE_KEY = getEnvVariable('BANCARD_PRIVATE_KEY', String)
export const BANCARD_API_URL = getEnvVariable(
  'BANCARD_API_URL',
  String,
  'https://vpos.infonet.com.py/vpos/api/0.3',
)
export const BANCARD_RETURN_URL = getEnvVariable('BANCARD_RETURN_URL', String)
export const BANCARD_CANCEL_URL = getEnvVariable('BANCARD_CANCEL_URL', String)
