module.exports = {
  extends: [
    '.eslintrc.js'
  ],

  rules: {
    'comma-dangle': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', {
      max: 1
    }],
    'padded-blocks': ['error', 'never'],

    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^_typeguard\\d?$',
      argsIgnorePattern: '^_unused\\d?$'
    }]
  }
}
