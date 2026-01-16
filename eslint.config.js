import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginImport from 'eslint-plugin-import'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      // No floating promises - must handle or explicitly void
      '@typescript-eslint/no-floating-promises': 'error',

      // Exhaustive switch statements
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // No any - use unknown instead
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Import order
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // No unused vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'examples/**', '*.config.*'],
  }
)
