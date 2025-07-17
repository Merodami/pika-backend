import dotenv from 'dotenv'
import { findUpSync } from 'find-up'

/**
 * Load .env files with override support
 */
export const getLocalEnv = (): void => {
  // For test environment, load .env.test
  if (process.env.NODE_ENV === 'test') {
    const testEnvPath = findUpSync('.env.test')

    if (testEnvPath) {
      dotenv.config({ path: testEnvPath })

      return
    }
  }

  const envFilename = process.env.ENV_FILE || '.env.local'
  const findEnv = () => findUpSync(envFilename)
  const findEnvOverride = () => findUpSync('.env')

  dotenv.config({ path: findEnv() })
  dotenv.config({ path: findEnvOverride(), override: true })
}

getLocalEnv()
