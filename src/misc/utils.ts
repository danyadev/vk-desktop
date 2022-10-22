import * as electron from '@electron/remote'

export const currentWindow = electron.getCurrentWindow()

export function timer(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function exhaustivenessCheck(_unused: never): never {
  throw new Error('Exhaustiveness failure! This should never happen.')
}

export type Opaque<Type, Token = unknown> = Type & {
  readonly __opaque__: Token
}

export type JSXElement = JSX.Element | string | number | null

export function toUrlParams(object: Record<string, string | number | null | undefined>) {
  return Object.keys(object).reduce((params, key) => {
    const value = object[key]
    if (value !== null && value !== undefined) {
      params.append(key, value.toString())
    }
    return params
  }, new URLSearchParams())
}

/**
 * Создает хук, который возвращает один и тот же результат, кешируемый при первом использовании хука
 *
 * Для корректной работы передаваемый хук должен возвращать либо ref, либо computed
 */
export function createSingletonHook<R extends object>(hook: (() => R)) {
  let hookResult: R
  return () => hookResult || (hookResult = hook())
}

// Вызывает целевую функцию через delay мс после последнего вызова обертки
export function debounce<T extends Function>(fn: T, delay: number) {
  let timerId: NodeJS.Timeout | null = null

  return function(this: unknown, ...args: unknown[]) {
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      fn.apply(this, args)
      timerId = null
    }, delay)
  }
}
