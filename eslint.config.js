import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules_old', '.claude/']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
    },
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Vite define() globals inyectados en build
        __APP_VERSION__: 'readonly',
        __BUILD_DATE__:  'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // jsx-uses-vars marca como "usada" cualquier variable referenciada en JSX
      // (incluye namespaces como <motion.div> que usan la variable motion).
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  // vite.config.js necesita globals de Node (process, __dirname, etc.)
  {
    files: ['vite.config.js', 'postcss.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        __APP_VERSION__: 'readonly',
        __BUILD_DATE__:  'readonly',
      },
    },
  },
])
