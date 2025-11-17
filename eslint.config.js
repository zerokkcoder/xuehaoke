const tseslint = require('typescript-eslint')
const reactHooks = require('eslint-plugin-react-hooks')
let nextPlugin
try { nextPlugin = require('eslint-plugin-next') } catch { nextPlugin = null }

module.exports = [
  // Global ignore patterns
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', '**/build/**'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      ...(nextPlugin ? { '@next/next': nextPlugin } : {}),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      ...(nextPlugin ? { '@next/next': nextPlugin } : {}),
    },
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]