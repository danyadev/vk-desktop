/* eslint-disable quote-props */

module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2021,
    tsconfigRootDir: __dirname,
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
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended'
  ],

  overrides: [
    {
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
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/consistent-type-definitions': 'off'
      }
    }
  ],

  rules: {
    //#region eslint
    'no-constant-binary-expression': 'error',
    'no-constant-condition': ['error', {
      // Разрешает while (true)
      checkLoops: false
    }],
    'no-constructor-return': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-negation': ['error', {
      // Запрещает выражения вида (!a < b)
      enforceForOrderingRelations: true
    }],
    'no-unsafe-optional-chaining': ['error', {
      // Запрещает математические операции с optional chaining: obj?.foo + bar
      disallowArithmeticOperators: true
    }],
    'no-unused-private-class-members': 'error',
    'use-isnan': ['error', {
      // Запрещает arr.indexOf(NaN)
      enforceForIndexOf: true
    }],
    'camelcase': ['error', {
      // Отключает проверку ключей в объектах
      properties: 'never'
    }],
    'curly': ['error', 'all'],
    'eqeqeq': ['error', 'always'],
    'func-style': ['error', 'declaration', {
      // Разрешает стрелочные функции
      allowArrowFunctions: true
    }],
    'new-cap': ['error', {
      // Не ругается на lowercase 'object' в new Class.object()
      properties: false
    }],
    'no-caller': 'error',
    'no-confusing-arrow': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-floating-decimal': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-lonely-if': 'error',
    'no-mixed-operators': 'error',
    'no-multi-assign': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-sequences': 'error',
    'no-undef-init': 'error',
    'no-unneeded-ternary': 'error',
    'no-useless-computed-key': ['error', {
      // Включает проверку для методов класса
      enforceForClassMembers: true
    }],
    'no-useless-concat': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'operator-assignment': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-const': ['error', {
      // Разрешает let, если какая-то переменная при деструктуризации переопределяется
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
      // Отключаем форсирование выражений [foo] = array
      AssignmentExpression: {
        array: false,
        object: false
      }
    }],
    'prefer-exponentiation-operator': 'error',
    'prefer-numeric-literals': 'error',
    'prefer-object-has-own': 'error',
    'prefer-object-spread': 'error',
    'prefer-regex-literals': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'quote-props': ['error', 'as-needed'],
    'radix': ['error', 'as-needed'],
    'spaced-comment': ['error', 'always', {
      markers: ['#region', '#endregion']
    }],
    'yoda': 'error',
    'array-bracket-newline': ['error', 'consistent'],
    'array-bracket-spacing': 'error',
    'arrow-parens': 'error',
    'arrow-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': 'error',
    'dot-location': ['error', 'property'],
    // eol-last в full файле
    'function-call-argument-newline': ['error', 'consistent'],
    'function-paren-newline': ['error', 'consistent'],
    'generator-star-spacing': ['error', {
      // function* generator() {}
      after: true,
      // const generator = function*() {}
      anonymous: 'neither',
      // const obj = { *generator() {} }
      method: 'before'
    }],
    'implicit-arrow-linebreak': 'error',
    'indent': ['error', 2, {
      // По умолчанию внутри switch была отключена табуляция
      SwitchCase: 1
    }],
    'jsx-quotes': 'error',
    'linebreak-style': 'error',
    'max-len': ['error', {
      code: 100,
      ignoreStrings: true,
      ignoreRegExpLiterals: true,
      ignoreUrls: true
    }],
    'new-parens': 'error',
    'no-multi-spaces': 'error',
    'no-tabs': 'error',
    // no-trailing-spaces в full файле
    'no-whitespace-before-property': 'error',
    'object-curly-newline': 'error',
    'rest-spread-spacing': 'error',
    'semi-spacing': 'error',
    'semi-style': 'error',
    'space-in-parens': 'error',
    'space-unary-ops': 'error',
    'switch-colon-spacing': 'error',
    'template-curly-spacing': 'error',
    'template-tag-spacing': 'error',
    'yield-star-spacing': 'error',
    'no-restricted-syntax': [
      'error',
      'CallExpression[callee.name="setTimeout"]',
      'CallExpression[callee.name="clearTimeout"]',
      'CallExpression[callee.name="setInterval"]',
      'CallExpression[callee.name="clearInterval"]'
    ],
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['assets/icons/*'],
          message: 'use assets/icons instead'
        },
        {
          group: ['misc/hooks/*'],
          message: 'use misc/hooks instead'
        },
        {
          group: ['ui/modals/parts/*'],
          message: 'use ui/modals/parts instead'
        }
      ]
    }],
    //#endregion eslint

    //#region eslint-plugin-import
    'import/no-extraneous-dependencies': 'error',
    'import/no-absolute-path': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': ['error', {
      noUselessIndex: true
    }],
    'import/extensions': ['error', 'always', {
      js: 'never',
      ts: 'never',
      tsx: 'never'
    }],
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-default-export': 'error',
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        ['internal', 'parent', 'sibling', 'index']
      ]
    }],
    'import/no-duplicates': 'error',
    //#endregion

    //#region @typescript-eslint
    '@typescript-eslint/array-type': ['error', {
      default: 'array-simple',
      readonly: 'generic'
    }],
    '@typescript-eslint/ban-ts-comment': ['error', {
      // Разрешаем только @ts-expect-error с описанием
      'ts-expect-error': 'allow-with-description',
      // Запрещаем разрешенный по умолчанию @ts-check
      'ts-check': true
    }],
    '@typescript-eslint/consistent-indexed-object-style': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'none'
      },
      singleline: {
        delimiter: 'comma'
      }
    }],
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/naming-convention': ['error', {
      // Разрешаем называть типы только в PascalCase
      selector: 'typeLike',
      format: ['PascalCase']
    }],
    '@typescript-eslint/no-base-to-string': 'error',
    '@typescript-eslint/no-confusing-void-expression': ['error', {
      // Разрешаем () => fnThatReturnVoid()
      ignoreArrowShorthand: true
    }],
    '@typescript-eslint/no-duplicate-enum-values': 'error',
    '@typescript-eslint/no-invalid-void-type': 'error',
    '@typescript-eslint/no-redundant-type-constituents': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-reduce-type-parameter': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/require-array-sort-compare': 'error',
    '@typescript-eslint/restrict-plus-operands': ['error', {
      // Проверяем так же += операнды
      checkCompoundAssignments: true
    }],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/ban-types': ['error', {
      types: {
        'JSX.Element': 'Use JSXElement type from misc/utils'
      }
    }],

    /**
     * Далее идут правила, которые расширяют eslint-правила.
     * Сами оригинальные eslint-правила должны быть выключены
     */
    '@typescript-eslint/brace-style': 'error',
    '@typescript-eslint/comma-spacing': 'error',
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/dot-notation': 'error',
    '@typescript-eslint/func-call-spacing': 'error',
    '@typescript-eslint/key-spacing': 'error',
    '@typescript-eslint/keyword-spacing': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-expressions': ['error', {
      // Разрешает fn && fn()
      allowShortCircuit: true
    }],
    // Включено в full файле
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/object-curly-spacing': ['error', 'always'],
    '@typescript-eslint/quotes': ['error', 'single', {
      avoidEscape: true
    }],
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/space-before-blocks': 'error',
    '@typescript-eslint/space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    '@typescript-eslint/space-infix-ops': 'error'
    //#endregion
  }
}
