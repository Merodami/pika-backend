import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber, parseString } from '../parsers.js'

export const SMTP_HOST = getEnvVariable(
  'SMTP_HOST',
  parseString,
  'smtp.example.com',
)
export const SMTP_PORT = getEnvVariable('SMTP_PORT', parseNumber, 587)
export const SMTP_SECURE = getEnvVariable(
  'SMTP_SECURE',
  (v: string) => v === 'true',
  false,
)
export const SMTP_USER = getEnvVariable(
  'SMTP_USER',
  parseString,
  'user@example.com',
)
export const SMTP_PASSWORD = getEnvVariable(
  'SMTP_PASSWORD',
  parseString,
  'password',
)
export const EMAIL_FROM = getEnvVariable(
  'EMAIL_FROM',
  String,
  'noreply@servicemarketplace.py',
)
export const EMAIL_FROM_NAME = getEnvVariable(
  'EMAIL_FROM_NAME',
  String,
  'Paraguay Services Marketplace',
)
