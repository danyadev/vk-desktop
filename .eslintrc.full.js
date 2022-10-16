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

    '@typescript-eslint/no-unused-vars': 'error'
  }
}
