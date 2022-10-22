/* eslint-disable quote-props */

module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2021,
    project: './tsconfig.json'
  },

  env: {
    browser: true,
    node: true,
    es2021: true
  },

  plugins: ['import'],

  settings: {
    'import/resolver': {
      typescript: {
        project: 'tsconfig.json'
      },
      node: {
        paths: ['./src']
      }
    },
    'import/ignore': []
  },

  extends: [
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended'
  ],

  overrides: [{
    files: ['**/*.{ts,tsx}'],
    extends: [
      'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: {
          // fn(async () => {}), ожидая () => void
          arguments: false,
          // <div fn={async () => {}} />, ожидая () => void
          attributes: false,
          // fn: async () => {}, ожидая () => void
          properties: false
        }
      }]
    }
  }],

  rules: {
    'array-bracket-spacing': 'error',
    'arrow-parens': 'error',
    'arrow-spacing': 'error',
    'block-scoped-var': 'error',
    'brace-style': 'error',
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': 'error',
    'dot-notation': 'error',
    'eqeqeq': ['error', 'always', {
      null: 'ignore'
    }],
    'for-direction': 'error',
    'func-call-spacing': 'error',
    'func-style': ['error', 'declaration', {
      allowArrowFunctions: true
    }],
    'function-call-argument-newline': ['error', 'consistent'],
    'function-paren-newline': ['error', 'consistent'],
    'indent': ['error', 2, {
      SwitchCase: 1
    }],
    'key-spacing': ['error', {
      mode: 'minimum'
    }],
    'keyword-spacing': 'error',
    'max-len': ['error', {
      code: 100,
      ignoreStrings: true,
      ignoreRegExpLiterals: true,
      ignoreUrls: true
    }],
    'new-cap': ['error', {
      properties: false
    }],
    'new-parens': 'error',
    'no-array-constructor': 'error',
    'no-caller': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': 'error',
    'no-confusing-arrow': 'error',
    'no-const-assign': 'error',
    'no-constant-condition': ['error', {
      checkLoops: false
    }],
    'no-constructor-return': 'error',
    'no-div-regex': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-empty': 'error',
    'no-ex-assign': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-boolean-cast': 'error',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-implied-eval': 'error',
    'no-import-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lonely-if': 'error',
    'no-loss-of-precision': 'error',
    'no-mixed-spaces-and-tabs': 'error',
    'no-multi-assign': 'error',
    'no-multi-spaces': ['error', {
      ignoreEOLComments: true
    }],
    'no-multi-str': 'error',
    'no-new-object': 'error',
    'no-new-symbol': 'error',
    'no-new-wrappers': 'error',
    'no-new': 'error',
    'no-obj-calls': 'error',
    'no-proto': 'error',
    'no-prototype-builtins': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-self-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-shadow-restricted-names': 'error',
    'no-this-before-super': 'error',
    'no-throw-literal': 'error',
    'no-undef-init': 'error',
    'no-undef': 'error',
    'no-unneeded-ternary': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-negation': 'error',
    'no-unused-expressions': ['error', {
      allowShortCircuit: true
    }],
    'no-useless-catch': 'error',
    'no-useless-computed-key': ['error', {
      enforceForClassMembers: true
    }],
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-escape': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-whitespace-before-property': 'error',
    'object-curly-newline': 'error',
    'object-curly-spacing': ['error', 'always'],
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'operator-assignment': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-const': ['error', {
      destructuring: 'all'
    }],
    'prefer-destructuring': ['error', {
      // false здесь означает, что проверяться такие кейсы не будут.
      // Для массивов я считаю нормальным многие варианты использования:
      // const id = match[1];
      // const [, type, id] = match;
      VariableDeclarator: {
        array: false,
        object: true
      },
      AssignmentExpression: {
        array: false,
        object: false
      }
    }],
    'prefer-exponentiation-operator': 'error',
    'prefer-numeric-literals': 'error',
    'prefer-object-spread': 'error',
    'prefer-regex-literals': 'error',
    'prefer-spread': 'error',
    'quote-props': ['error', 'as-needed'],
    'quotes': ['error', 'single', {
      avoidEscape: true
    }],
    'require-await': 'error',
    'require-yield': 'error',
    'rest-spread-spacing': 'error',
    'semi-spacing': 'error',
    'semi-style': 'error',
    'semi': ['error', 'never'],
    'space-before-blocks': 'error',
    'space-in-parens': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    'switch-colon-spacing': 'error',
    'template-curly-spacing': 'error',
    'template-tag-spacing': 'error',
    'use-isnan': ['error', {
      enforceForSwitchCase: true,
      enforceForIndexOf: true
    }],
    'valid-typeof': 'error',
    'yield-star-spacing': 'error',
    'yoda': 'error',

    'import/default': 'error',
    'import/export': 'error',
    'import/extensions': ['error', 'always', {
      js: 'never',
      ts: 'never',
      tsx: 'never'
    }],
    'import/first': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/no-self-import': 'error',
    'import/no-unresolved': 'error',
    'import/no-unused-modules': ['error', {
      unusedExports: true
    }],
    'import/no-useless-path-segments': ['error', {
      noUselessIndex: true
    }],
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        ['internal', 'parent', 'sibling', 'index']
      ]
    }],

    '@typescript-eslint/space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    '@typescript-eslint/ban-types': ['error', {
      extendDefaults: true,
      types: {
        Function: false
      }
    }],

    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // Включено в .eslintrc.full.js
    '@typescript-eslint/no-unused-vars': 'off'
  }
}
