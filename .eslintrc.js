module.exports = {
  root: true,

  parserOptions: {
    sourceType: 'module'
  },

  env: {
    browser: true,
    node: true,
    es2020: true
  },

  plugins: ['import'],

  settings: {
    'import/resolver': 'webpack',
    'import/ignore': []
  },

  extends: ['plugin:vue/vue3-recommended'],

  rules: {
    'array-bracket-spacing': 'error',
    'arrow-body-style': 'error',
    'arrow-parens': 'error',
    'arrow-spacing': 'error',
    'block-scoped-var': 'error',
    'brace-style': 'error',
    // 'camelcase': 'error', // TODO
    'comma-dangle': 'error',
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': 'error',
    'dot-notation': 'error',
    'eol-last': 'error',
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
    'lines-between-class-members': 'error',
    'max-len': ['error', {
      code: 100,
      ignoreStrings: true,
      ignoreRegExpLiterals: true
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
    'no-multiple-empty-lines': ['error', {
      max: 1
    }],
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
    'no-trailing-spaces': 'error',
    'no-undef-init': 'error',
    'no-undef': 'error',
    'no-underscore-dangle': 'error',
    'no-unneeded-ternary': 'error',
    'no-unreachable': 'error',
    'no-unsafe-negation': 'error',
    'no-unused-expressions': ['error', {
      allowShortCircuit: true
    }],
    'no-unused-vars': 'error',
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
    'operator-linebreak': ['error', 'after', {
      overrides: ['?', ':', '+', '>', '<', '>=', '<=']
        .reduce((all, operator) => (
          all[operator] = 'before', all
        ), {})
    }],
    'padded-blocks': ['error', 'never'],
    'prefer-arrow-callback': 'error',
    'prefer-const': ['error', {
      destructuring: 'all'
    }],
    'prefer-destructuring': ['error', {
      // false здесь означает, что проверяться такие кейсы не будут.
      // Для массивов я считаю нормальным многие варианты использования:
      // const id = match[1];
      // const [, type, id] = match;
      // [item] = await fn();
      VariableDeclarator: {
        array: false,
        object: true
      },
      AssignmentExpression: {
        array: false,
        object: true
      }
    }],
    'prefer-exponentiation-operator': 'error',
    'prefer-numeric-literals': 'error',
    'prefer-object-spread': 'error',
    'prefer-regex-literals': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'quote-props': ['error', 'as-needed'],
    'quotes': ['error', 'single'],
    'require-await': 'error',
    'require-yield': 'error',
    'rest-spread-spacing': 'error',
    'semi-spacing': 'error',
    'semi-style': 'error',
    'semi': 'error',
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
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
      js: 'never'
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

    'vue/singleline-html-element-content-newline': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/require-prop-types': 'off',
    'vue/no-v-html': 'off',
    'vue/prop-name-casing': 'off', // TODO
    'vue/require-render-return': 'off',
    'vue/no-setup-props-destructure': 'off',
    'vue/attribute-hyphenation': ['error', 'never'],
    'vue/max-attributes-per-line': ['error', {
      singleline: 4,
      multiline: {
        allowFirstLine: true,
        max: 2
      }
    }],
    'vue/order-in-components': ['error', {
      order: [
        'props',
        'components',
        'setup'
      ]
    }],
    'vue/component-tags-order': ['error', {
      order: ['template', 'script', 'style']
    }],
    'vue/html-self-closing': ['error', {
      html: {
        void: 'never',
        normal: 'any',
        component: 'always'
      },
      svg: 'always',
      math: 'always'
    }]
  }
};
