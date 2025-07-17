import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['../tests/src/utils/setupTests.ts'],
  },
  resolve: {
    alias: {
      '@pika/crypto': resolve(__dirname, './src'),
    },
  },
})
