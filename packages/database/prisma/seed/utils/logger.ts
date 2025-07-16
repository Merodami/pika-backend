/**
 * Simple logger utility for seed operations
 */

import { DEBUG } from '@pika/environment'

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

/**
 * Logger for seed operations with color-coded output
 */
export const logger = {
  /**
   * Log general information message
   */
  info: (message: string, ...args: unknown[]): void => {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`, ...args)
  },

  /**
   * Log success message
   */
  success: (message: string, ...args: unknown[]): void => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args)
  },

  /**
   * Log warning message
   */
  warn: (message: string, ...args: unknown[]): void => {
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`, ...args)
  },

  /**
   * Log error message
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`, ...args)
  },

  /**
   * Log debug message (only shown when DEBUG=true)
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (DEBUG) {
      console.log(`${colors.cyan}[DEBUG]${colors.reset} ${message}`, ...args)
    }
  }
}