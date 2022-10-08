import * as electron from '@electron/remote'

export const currentWindow = electron.getCurrentWindow()

export function timer(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function exhaustivenessCheck(_unused: never): never {
  throw new Error('Exhaustiveness failure! This should never happen.')
}

export function toUrlParams(object: Record<string, string | number | null | undefined>) {
  return Object.keys(object).reduce((params, key) => {
    const value = object[key]
    if (value !== null && value !== undefined) {
      params.append(key, value.toString())
    }
    return params
  }, new URLSearchParams())
}

// Вызывает целевую функцию через delay мс после последнего вызова обертки
export function debounce<T extends Function>(fn: T, delay: number) {
  let timerId: NodeJS.Timeout | null

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
