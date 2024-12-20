/* eslint-disable quote-props */

module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2023,
    tsconfigRootDir: __dirname,
    project: true
  },

  env: {
    browser: true,
    node: true,
    es2021: true
  },

  plugins: ['import', 'simple-import-sort'],

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
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic'
  ],

  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked'
      ],
      rules: {
        '@typescript-eslint/consistent-type-definitions': 'off',
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
        }],
        // Включено в full файле
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      files: ['build/*.ts', '**/*.test.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off'
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
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['actions/*'],
          message: 'Use \'actions\' instead'
        },
        {
          group: ['assets/icons/*'],
          message: 'Use \'assets/icons\' instead'
        },
        {
          group: ['hooks/*'],
          message: 'Use \'hooks\' instead'
        },
        {
          group: ['ui/modals/parts/*'],
          message: 'Use \'ui/modals/parts\' instead'
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
    'import/no-duplicates': 'error',
    'import/no-restricted-paths': ['error', {
      basePath: './src',
      zones: [{
        // Где применяются ограничения
        target: ['lang', 'misc', 'model', 'store'],
        // Откуда нельзя импортировать
        from: ['actions', 'hooks', 'ui']
      }, {
        target: ['converters'],
        from: ['hooks', 'ui']
      }]
    }],
    //#endregion

    'simple-import-sort/imports': ['error', {
      groups: [[
        ...['^fs($|/)', '^os$', '^path$', '^child_process$'],
        ...['^@?electron', '^vue', '^pinia', '^@?vite', '^@vkontakte/vk-qr'],
        ...['^env', '^model', '^store', '^actions', '^converters', '^lang'],
        ...['^hooks', '^misc/utils', '^misc'],
        ...['^main-process', '^\\./', '^ui', '^assets', '.css$']
      ]]
    }],

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
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'none'
      },
      singleline: {
        delimiter: 'comma'
      }
    }],
    '@typescript-eslint/naming-convention': ['error', {
      // Разрешаем называть типы только в PascalCase
      selector: 'typeLike',
      format: ['PascalCase']
    }],
    '@typescript-eslint/no-confusing-void-expression': ['error', {
      // Разрешаем () => fnThatReturnVoid()
      ignoreArrowShorthand: true
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-extra-semi': 'error',
    '@typescript-eslint/no-invalid-void-type': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unsafe-unary-minus': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': ['error', {
      ignorePrimitives: {
        string: true
      }
    }],
    '@typescript-eslint/prefer-reduce-type-parameter': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': ['error', {
      requireDefaultForNonUnion: true
    }],
    '@typescript-eslint/ban-types': ['error', {
      types: {
        'JSX.Element': 'Use JSXElement type from misc/utils'
      }
    }],
    '@typescript-eslint/no-array-delete': 'error',
    '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',

    /**
     * Далее идут правила, которые расширяют eslint-правила.
     * Сами оригинальные eslint-правила должны быть выключены
     */
    '@typescript-eslint/brace-style': 'error',
    '@typescript-eslint/comma-spacing': 'error',
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/func-call-spacing': 'error',
    '@typescript-eslint/key-spacing': 'error',
    '@typescript-eslint/keyword-spacing': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-expressions': ['error', {
      // Разрешает fn && fn()
      allowShortCircuit: true
    }],
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-unnecessary-template-expression': 'error',
    '@typescript-eslint/object-curly-spacing': ['error', 'always'],
    '@typescript-eslint/prefer-destructuring': ['error', {
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
