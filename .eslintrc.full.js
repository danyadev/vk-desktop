module.exports = {
  extends: [
    '.eslintrc.js'
  ],

  reportUnusedDisableDirectives: true,

  rules: {
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', {
      max: 1
    }],
    'padded-blocks': ['error', 'never'],

    'import/no-unused-modules': ['error', {
      unusedExports: true
    }],

    '@typescript-eslint/comma-dangle': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      caughtErrors: 'all',
      varsIgnorePattern: '^_typeguard\\d?$',
      argsIgnorePattern: '^_unused\\d?$'
    }]
  }
}
