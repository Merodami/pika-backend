import eslintPluginNext from '@next/eslint-plugin-next'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'lib/api/generated/**',
      '.env*.local',
      '*.tsbuildinfo',
      'next-env.d.ts',
    ],
  },
  {
    plugins: {
      '@next/next': eslintPluginNext,
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
    },
  },
]
