import { resolve } from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Core package aliases (short form)
      '@shared': resolve(__dirname, './packages/shared/src'),
      '@api': resolve(__dirname, './packages/api/src'),
      '@types': resolve(__dirname, './packages/types/src'),
      '@sdk': resolve(__dirname, './packages/sdk/src'),
      '@api-gateway': resolve(__dirname, './packages/api-gateway/src'),
      '@database': resolve(__dirname, './packages/database/src'),
      '@redis': resolve(__dirname, './packages/redis/src'),
      '@http': resolve(__dirname, './packages/http/src'),
      '@auth': resolve(__dirname, './packages/auth/src'),
      '@tests': resolve(__dirname, './packages/tests/src'),
      '@environment': resolve(__dirname, './packages/environment/src'),
      // Full @pika/ package aliases
      '@pikahared': resolve(__dirname, './packages/shared/src'),
      '@pikapi': resolve(__dirname, './packages/api/src'),
      '@pikaypes': resolve(__dirname, './packages/types/src'),
      '@pikadk': resolve(__dirname, './packages/sdk/src'),
      '@pikattp': resolve(__dirname, './packages/http/src'),
      '@pikaedis': resolve(__dirname, './packages/redis/src'),
      '@pikauth': resolve(__dirname, './packages/auth/src'),
      '@pikaatabase': resolve(__dirname, './packages/database/src'),
      '@pikanvironment': resolve(__dirname, './packages/environment/src'),
      '@pikaests': resolve(__dirname, './packages/tests/src'),
      // Service aliases
      '@pikaser': resolve(__dirname, './packages/services/user/src'),
      '@pikaym': resolve(__dirname, './packages/services/gym/src'),
      '@pikauth-service': resolve(__dirname, './packages/services/auth/src'),
      '@pikaession': resolve(__dirname, './packages/services/session/src'),
      '@pikaubscription': resolve(
        __dirname,
        './packages/services/subscription/src',
      ),
      '@pikaayment': resolve(__dirname, './packages/services/payment/src'),
      '@pikaommunication': resolve(
        __dirname,
        './packages/services/communication/src',
      ),
      '@communication': resolve(
        __dirname,
        './packages/services/communication/src',
      ),
      '@pikaupport': resolve(__dirname, './packages/services/support/src'),
      '@pikaile-storage': resolve(
        __dirname,
        './packages/services/file-storage/src',
      ),
      '@pikaocial': resolve(__dirname, './packages/services/social/src'),
      // Service-specific aliases
      '@subscription': resolve(
        __dirname,
        './packages/services/subscription/src',
      ),
      '@social': resolve(__dirname, './packages/services/social/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    env: loadEnv('test', process.cwd(), ''),
    setupFiles: ['./packages/tests/src/utils/setupTests.ts'],
    include: ['packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['verbose'],
    // Extended timeouts for all tests
    testTimeout: 60000, // 60 seconds for individual tests
    hookTimeout: 120000, // 120 seconds for setup/teardown hooks
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/previous-architecture/**',
    ],
    // Enable test isolation to prevent worker crashes
    isolate: true,
    poolOptions: {
      threads: {
        // Limit the number of threads to prevent resource exhaustion
        maxThreads: 4,
        minThreads: 1,
        // Enable isolation for thread safety
        isolate: true,
      },
      forks: {
        maxForks: 2,
        minForks: 1,
        isolate: true,
      },
    },
    // Allow some concurrency but with limits
    pool: 'threads',
    maxConcurrency: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
      ],
    },
  },
})
