/* eslint-disable @stylistic/quote-props */

module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2023,
    tsconfigRootDir: __dirname,
    projectService: true
  },

  env: {
    browser: true,
    node: true,
    es2021: true
  },

  plugins: ['import-x', 'simple-import-sort', '@stylistic', '@stylistic/js'],

  settings: {
    'import-x/resolver': {
      typescript: {
        project: 'tsconfig.json'
      },
      node: {
        paths: ['./src']
      }
    },
    'import-x/ignore': []
  },

  extends: [
    'eslint:recommended',
    'plugin:import-x/recommended',
    'plugin:import-x/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'plugin:@stylistic/recommended-extends'
  ],

  overrides: [
    {
      files: ['**/*.{ts,tsx,mts}'],
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
        '@typescript-eslint/only-throw-error': 'off',
        '@typescript-eslint/prefer-promise-reject-errors': 'off',
        '@typescript-eslint/prefer-regexp-exec': 'off',
        // Включено в full файле
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      files: ['build/*.ts', '**/*.test.ts'],
      rules: {
        'import-x/no-extraneous-dependencies': 'off'
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
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-lonely-if': 'error',
    'no-multi-assign': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-return-assign': 'error',
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
    'radix': ['error', 'as-needed'],
    'yoda': 'error',
    //#endregion eslint

    //#region eslint-plugin-import
    'import-x/no-extraneous-dependencies': 'error',
    'import-x/no-absolute-path': 'error',
    'import-x/no-dynamic-require': 'error',
    'import-x/no-self-import': 'error',
    'import-x/no-useless-path-segments': ['error', {
      noUselessIndex: true
    }],
    'import-x/extensions': ['error', 'always', {
      js: 'never',
      ts: 'never',
      tsx: 'never'
    }],
    'import-x/first': 'error',
    'import-x/newline-after-import': 'error',
    'import-x/no-default-export': 'error',
    'import-x/no-duplicates': 'error',
    'import-x/no-restricted-paths': ['error', {
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
        ...['^@?electron', '^@?vite', '^vue', '^pinia', '^@vkontakte/vk-qr', '^@floating-ui/dom'],
        ...['^env', '^model', '^store', '^actions', '^converters', '^lang'],
        ...['^hooks', '^misc/utils', '^misc'],
        ...['^main-process', '^\\./', '^ui', '^assets', '.css$']
      ]]
    }],

    //#region @typescript-eslint
    '@typescript-eslint/array-type': ['error', {
      default: 'array-simple', // string[] / Array<string | number>
      readonly: 'generic' // ReadonlyArray<string> / ReadonlyArray<string | number>
    }],
    '@typescript-eslint/ban-ts-comment': ['error', {
      // Запрещаем разрешенный по умолчанию @ts-check
      'ts-check': true
    }],
    '@typescript-eslint/no-restricted-types': ['error', {
      types: {
        'JSX.Element': {
          message: 'Use JSXElement type from misc/utils',
          fixWith: 'JSXElement'
        }
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
    '@typescript-eslint/no-invalid-void-type': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': ['error', {
      ignorePrimitives: {
        string: true
      }
    }],
    '@typescript-eslint/prefer-reduce-type-parameter': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': ['error', {
      requireDefaultForNonUnion: true,
      considerDefaultExhaustiveForUnions: true
    }],
    '@typescript-eslint/no-array-delete': 'error',
    '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',

    /**
     * Далее идут правила, которые расширяют eslint-правила.
     * Сами оригинальные eslint-правила должны быть выключены
     */
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-expressions': ['error', {
      // Разрешает fn && fn()
      allowShortCircuit: true
    }],
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-unnecessary-template-expression': 'error',
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
    '@typescript-eslint/no-restricted-imports': ['error', {
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
    //#endregion

    //#region stylistic
    '@stylistic/array-bracket-newline': ['error', 'consistent'],
    '@stylistic/array-element-newline': ['error', 'consistent'],
    '@stylistic/arrow-parens': ['off', 'always'],
    '@stylistic/brace-style': ['error', '1tbs'],
    '@stylistic/comma-dangle': ['error', 'never'],
    // Не считает комментарии за элементы
    // https://github.com/eslint-stylistic/eslint-stylistic/issues/675
    // '@stylistic/curly-newline': ['error', { minElements: 1 }],
    '@stylistic/function-call-argument-newline': ['error', 'consistent'],
    '@stylistic/function-call-spacing': 'error',
    '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
    '@stylistic/generator-star-spacing': ['error', {
      // function* generator() {}
      after: true,
      // const generator = function*() {}
      anonymous: 'neither',
      // const obj = { *generator() {} }
      method: 'before'
    }],
    '@stylistic/implicit-arrow-linebreak': 'error',
    // Включаем только js правила, потому что ts работает очень плохо
    '@stylistic/indent': 'off',
    '@stylistic/js/indent': ['error', 2, {
      // По умолчанию внутри switch была отключена табуляция
      SwitchCase: 1
    }],
    // Считает юнион типы за бинарные операции
    // https://github.com/eslint-stylistic/eslint-stylistic/issues/676
    '@stylistic/indent-binary-ops': 'off',
    '@stylistic/jsx-curly-spacing': ['error', {
      when: 'never',
      children: true,
      attributes: true
    }],
    '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
    '@stylistic/jsx-one-expression-per-line': 'off',
    '@stylistic/jsx-self-closing-comp': 'error',
    '@stylistic/jsx-wrap-multilines': ['error', {
      declaration: 'parens-new-line',
      assignment: 'parens-new-line',
      return: 'parens-new-line',
      arrow: 'parens-new-line',
      condition: 'parens-new-line',
      logical: 'parens-new-line',
      prop: 'ignore',
      propertyValue: 'parens-new-line'
    }],
    '@stylistic/linebreak-style': 'error',
    '@stylistic/max-len': ['error', {
      code: 100,
      ignoreStrings: true,
      ignoreRegExpLiterals: true,
      ignoreUrls: true
    }],
    '@stylistic/multiline-ternary': ['error', 'always-multiline', { ignoreJSX: true }],
    '@stylistic/no-confusing-arrow': 'error',
    '@stylistic/no-extra-semi': 'error',
    // Включено в full файле
    '@stylistic/no-multiple-empty-lines': 'off',
    // Включено в full файле
    '@stylistic/no-trailing-spaces': 'off',
    '@stylistic/object-curly-newline': ['error', { consistent: true }],
    '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    '@stylistic/operator-linebreak': ['error', 'after', {
      overrides: {
        '?': 'before',
        ':': 'before'
      }
    }],
    // Включено в full файле
    '@stylistic/padded-blocks': 'off',
    '@stylistic/quote-props': ['error', 'as-needed'],
    '@stylistic/semi-style': 'error',
    '@stylistic/space-before-function-paren': ['error', {
      named: 'never',
      asyncArrow: 'always',
      anonymous: 'always'
    }],
    '@stylistic/spaced-comment': ['error', 'always', {
      markers: ['#region', '#endregion']
    }],
    '@stylistic/switch-colon-spacing': 'error'
    //#endregion
  }
}
