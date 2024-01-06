import * as electron from '@electron/remote'
import { onScopeDispose } from 'vue'

export type Opaque<Type, Token = unknown> = Type & {
  readonly __opaque__: Token
}

// Тип JSX.Element запрещен в пользу JSXElement, здесь его единственное использование
// eslint-disable-next-line @typescript-eslint/ban-types
export type JSXElement = JSX.Element | string | number | null | false

type ClassNameUnit = string | false | 0
export type ClassName =
  | ClassNameUnit
  | ClassNameUnit[]
  | Record<string, boolean>

export type Truthy<T> = T extends false | '' | 0 | null | undefined | 0n ? never : T

export type NonEmptyArray<T> = [T, ...T[]]

export const currentWindow = electron.getCurrentWindow()

export function isObject(obj: unknown): obj is object {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
  return array.length > 0
}

export function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}

export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function exhaustivenessCheck(_unused: never): never {
  throw new Error('Exhaustiveness failure! This should never happen.')
}

export function typeguard(_unused: never) {
  // Функция предназначена для того, чтобы падать по типам при передаче неправильного значения
}

export function getFirstLetter(string: string): string {
  return new Intl.Segmenter().segment(string).containing(0).segment
}

/**
 * Позволяет отфильтровать массив от falsy значений и убрать нежелательные
 * варианты значений из типов
 *
 * Использование:
 * array.filter(isTruthy)
 * как аналог
 * array.filter(Boolean)
 */
// export function isTruthy<T>(value: T): value is Truthy<T> {
//   return !!value
// }

export function toUrlParams(object: Record<string, string | number | null | undefined>) {
  return Object.keys(object).reduce((params, key) => {
    const value = object[key]
    if (value !== null && value !== undefined) {
      params.append(key, value.toString())
    }
    return params
  }, new URLSearchParams()).toString()
}

/**
 * Создает хук, который возвращает один и тот же результат, кешируемый при первом использовании хука
 *
 * Для корректной работы передаваемый хук должен возвращать реактивный объект
 * (ref / reactive / computed)
 */
export function createSingletonHook<R extends object>(hook: (() => R)) {
  let hookResult: R | undefined
  return () => hookResult ?? (hookResult = hook())
}

export function subscribeToElectronEvent(subscribe: (() => () => void)) {
  const unsubscribe = subscribe()

  /**
   * Подписываемся на событие в компоненте или эффект скоупе ->
   *   при анмаунте компонента или инвалидации скоупа отписываемся от события
   *
   * В режиме разработки к этому прибавляется перезагрузка страницы.
   * Если инвалидировался скоуп, (а это значит, что не было перезагрузки),
   * то дополнительно отписываемся от события beforeunload
   */
  const { DEV } = import.meta.env

  function removeListener() {
    unsubscribe()
    DEV && window.removeEventListener('beforeunload', removeListener)
  }

  onScopeDispose(removeListener)
  DEV && window.addEventListener('beforeunload', removeListener)
}

export { debounce } from 'main-process/shared'
