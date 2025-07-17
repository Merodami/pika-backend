/**
 * Fraud detection related types
 */

/**
 * Fraud flag types
 */
export type FraudFlagType =
  | 'VELOCITY'
  | 'LOCATION_ANOMALY'
  | 'RAPID_REDEMPTION'
  | 'DISTANT_LOCATION'

/**
 * Fraud severity levels
 */
export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Fraud flag
 */
export interface FraudFlag {
  type: FraudFlagType
  severity: FraudSeverity
  message: string
  details?: Record<string, any>
}

/**
 * Fraud case action types
 */
export type FraudActionType =
  | 'block_customer'
  | 'void_redemption'
  | 'flag_provider'
  | 'whitelist_pattern'

/**
 * Fraud case action
 */
export interface FraudCaseAction {
  type: FraudActionType
  timestamp: Date
  performedBy: string
  details?: Record<string, any>
}
