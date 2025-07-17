/**
 * Centralized logging utility that respects environment settings
 * Automatically handles development vs production logging
 */

interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

class ConsoleLogger implements Logger {
  private isDevelopment = process?.env?.NODE_ENV === 'development'
  private isTest = process?.env?.NODE_ENV === 'test'

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment && !this.isTest) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isDevelopment && !this.isTest) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.isTest) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (!this.isTest) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }
}

// Export singleton instance
export const logger = new ConsoleLogger()

// Export factory for dependency injection if needed
export const createLogger = (): Logger => new ConsoleLogger()
