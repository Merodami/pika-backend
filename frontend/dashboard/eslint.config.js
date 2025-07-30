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
]