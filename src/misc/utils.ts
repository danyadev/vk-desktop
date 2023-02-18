import * as electron from '@electron/remote'
import { onScopeDispose } from 'vue'

export type Opaque<Type, Token = unknown> = Type & {
  readonly __opaque__: Token
}

// Тип JSX.Element запрещен в пользу JSXElement, здесь его единственное использование
// eslint-disable-next-line @typescript-eslint/ban-types
export type JSXElement = JSX.Element | string | number | null

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T

export type NonEmptyArray<T> = [T, ...T[]]

export const currentWindow = electron.getCurrentWindow()

export function isObject(obj: unknown): obj is object {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function timer(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}

export function exhaustivenessCheck(_unused: never): never {
  throw new Error('Exhaustiveness failure! This should never happen.')
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
  return () => hookResult || (hookResult = hook())
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

/**
 * Вызывает целевую функцию через delay мс после последнего вызова обертки
 */
export function debounce<T extends ((...args: never[]) => void)>(fn: T, delay: number) {
  let timerId: number | null = null

  return function(this: unknown, ...args: Parameters<T>) {
    if (timerId) {
      window.clearTimeout(timerId)
    }

    timerId = window.setTimeout(() => {
      fn.apply(this, args)
      timerId = null
    }, delay)
  }
}
