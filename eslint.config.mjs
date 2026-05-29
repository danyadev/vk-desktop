import globals from 'globals'
import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import { importX } from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

/* eslint-disable @stylistic/quote-props */

export default defineConfig([
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  tsEslint.configs.stylistic,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  stylistic.configs.recommended,

  {
    files: ['**/*.{js,ts,tsx,mjs,mts}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2023,
        tsconfigRootDir: import.meta.dirname,
        projectService: true
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    linterOptions: {
      // Включены в .full файле
      reportUnusedDisableDirectives: 'off',
      reportUnusedInlineConfigs: 'off'
    },
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    settings: {
      'import-x/extensions': ['.js', '.jsx', '.ts', '.tsx'],
      'import-x/cache': { lifetime: 'Infinity' },
      'import-x/resolver-next': createTypeScriptImportResolver()
    },
    rules: {
      //#region eslint
      'no-constant-condition': ['error', {
        // Разрешает while (true)
        checkLoops: false
      }],
      'no-constructor-return': 'error',
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
      'radix': 'error',
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
          target: ['lang', 'misc', 'model'],
          // Откуда нельзя импортировать
          from: ['actions', 'hooks', 'store', 'ui']
        }, {
          target: ['store'],
          from: ['actions', 'hooks', 'ui']
        }, {
          target: ['converters'],
          from: ['hooks', 'ui']
        }, {
          target: ['../main-process', 'actions', 'converters', 'hooks', 'lang', 'misc', 'model', 'store', 'ui'],
          from: 'services',
          except: ['./index.ts', './contracts']
        }]
      }],
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-unresolved': 'off',
      //#endregion

      'simple-import-sort/imports': ['error', {
        groups: [[
          ...['^fs($|/)', '^os$', '^path$', '^child_process$'],
          ...['^@?electron', '^@?vite', '^vue', '^pinia', '^@vkontakte/vk-qr', '^@floating-ui/dom'],
          ...['^services', '^model', '^store', '^actions', '^converters', '^lang'],
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
      '@typescript-eslint/no-useless-default-assignment': 'error',

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
      '@typescript-eslint/no-unnecessary-type-conversion': 'error',
      //#endregion

      //#region stylistic
      '@stylistic/arrow-parens': ['off', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/comma-dangle': ['error', 'never'],
      // Не считает комментарии за элементы
      // https://github.com/eslint-stylistic/eslint-stylistic/issues/675
      // '@stylistic/curly-newline': ['error', { minElements: 1 }],
      '@stylistic/function-call-spacing': 'error',
      '@stylistic/generator-star-spacing': ['error', {
        // function* generator() {}
        after: true,
        // const generator = function*() {}
        anonymous: 'neither',
        // const obj = { *generator() {} }
        method: 'before'
      }],
      '@stylistic/implicit-arrow-linebreak': 'error',
      '@stylistic/indent': ['error', 2, {
        // По умолчанию внутри switch была отключена табуляция
        SwitchCase: 1,
        ignoredNodes: ['TSMappedType > TSTypeReference', 'TSUnionType > TSTypeLiteral']
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
      '@stylistic/operator-linebreak': ['error', 'after', {
        overrides: {
          '?': 'before',
          ':': 'before',
          // Правило считает TS Union и Binary Operator за одно и то же, поэтому игнорим
          '|': 'ignore'
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
      '@stylistic/switch-colon-spacing': 'error',

      '@stylistic/array-bracket-newline': 'off',
      '@stylistic/array-element-newline': 'off',
      '@stylistic/array-bracket-spacing': 'off',
      '@stylistic/function-call-argument-newline': 'off',
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/object-property-newline': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/exp-list-style': 'error'
      //#endregion
    }
  },

  {
    files: ['**/*.{ts,tsx,mts}'],
    extends: [
      tsEslint.configs.recommendedTypeChecked,
      tsEslint.configs.stylisticTypeChecked
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
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-misused-spread': 'error'
    }
  },

  {
    files: ['build/*.ts', '**/*.test.ts', '**/*.{mjs,mts}'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-default-export': 'off',
      'import-x/no-unused-modules': 'off',
      'import-x/extensions': 'off',
      'simple-import-sort/imports': 'off'
    }
  }
])
