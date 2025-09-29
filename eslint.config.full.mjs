import { defineConfig } from 'eslint/config'
import mainConfig from './eslint.config.mjs'

export default defineConfig([{
  extends: [mainConfig],
  linterOptions: {
    reportUnusedDisableDirectives: 'error',
    reportUnusedInlineConfigs: 'error'
  },
  rules: {
    'import-x/no-unused-modules': ['error', {
      unusedExports: true
    }],

    '@typescript-eslint/no-unused-vars': ['error', {
      caughtErrors: 'all',
      varsIgnorePattern: '^_typeguard\\d?$',
      argsIgnorePattern: '^_'
    }],

    '@stylistic/no-multiple-empty-lines': ['error', {
      max: 1
    }],
    '@stylistic/no-trailing-spaces': 'error',
    '@stylistic/padded-blocks': ['error', 'never'],

    ...(process.env.CI && {
      'no-console': ['error', {
        allow: ['warn', 'error']
      }]
    })
  }
}])
