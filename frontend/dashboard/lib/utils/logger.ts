/**
 * Centralized logging utility that respects environment settings
 * Automatically handles development vs production logging
 */

interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

class ConsoleLogger implements Logger {
  private isDevelopment = process?.env?.NODE_ENV === 'development'
  private isTest = process?.env?.NODE_ENV === 'test'

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment && !this.isTest) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment && !this.isTest) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.isTest) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (!this.isTest) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }
}

// Export singleton instance
export const logger = new ConsoleLogger()

// Export factory for dependency injection if needed
export const createLogger = (): Logger => new ConsoleLogger()
