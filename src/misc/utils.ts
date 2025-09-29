import * as electron from '@electron/remote'
import { ComponentPublicInstance, KeyboardEvent, type MouseEvent, onScopeDispose, Ref, unref } from 'vue'

export { debounce } from 'main-process/shared'

export type Opaque<Type, Token = unknown> = Type & {
  __opaque__: Token
}

// Тип JSX.Element запрещен в пользу JSXElement, здесь его единственное использование
// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type JSXElement = JSX.Element | string | number | null | false

type NormalElement = HTMLElement | SVGElement | null
type RawElement = NormalElement | Element
export type RefElement = NormalElement | ComponentPublicInstance
export type RawRefElement = RawElement | ComponentPublicInstance

type ClassNameUnit = string | false | 0
export type ClassName =
  | ClassNameUnit
  | ClassNameUnit[]
  | Record<string, boolean>

export type Truthy<T> = T extends false | '' | 0 | null | undefined | 0n ? never : T

export type NonEmptyArray<T> = [T, ...T[]]

// export type Flatten<T> = T extends (Array<infer U> | NonEmptyArray<infer U>) ? U : T

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

export function exhaustivenessCheck(_never: never): never {
  throw new Error('Exhaustiveness failure! This should never happen.')
}

export function typeguard(_never: never) {
  // Функция предназначена для того, чтобы падать по типам при передаче неправильного значения
}

/**
 * Вызывает целевую функцию через delay мс после предыдущей вызова целевой функции
 */
export function throttle<
  Args extends unknown[],
  T extends ((...args: Args) => void)
>(fn: T, delay: number) {
  let timerId = 0
  let lastCallTimestamp = 0

  return function (this: unknown, ...args: Args) {
    clearTimeout(timerId)

    const lastCallDelta = Date.now() - lastCallTimestamp

    if (lastCallDelta >= delay) {
      fn.apply(this, args)
      lastCallTimestamp = Date.now()
      return
    }

    timerId = window.setTimeout(() => {
      fn.apply(this, args)
      lastCallTimestamp = Date.now()
    }, delay - lastCallDelta)
  }
}

const getSegmenter = createSingletonHook(() => new Intl.Segmenter())

export function getFirstLetter(string: string): string {
  return getSegmenter().segment(string).containing(0).segment
}

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

type SplitterChunk =
  | { kind: 'separator', value: string }
  | { kind: 'rest', value: string }
/**
 * Раскладывает строку по сепаратору на массив чанков
 *
 * Важно: в значении separator будет находиться значение, обернутое в скобки в регулярке
 */
export function splitter(string: string, regexp: RegExp): SplitterChunk[] {
  const chunks = string.split(regexp)
  let isSeparator = !!chunks[0]?.match(regexp)

  return chunks.map((value) => {
    const kind = isSeparator ? 'separator' : 'rest'
    isSeparator = !isSeparator
    return { kind, value }
  })
}

export async function getPlatform() {
  const deviceInfo = await navigator.userAgentData?.getHighEntropyValues([
    'platform',
    'platformVersion'
  ]).catch(() => null)

  return deviceInfo
    ? `${deviceInfo.platform} ${deviceInfo.platformVersion}`
    : navigator.userAgentData?.platform ?? 'Unknown'
}

export function unrefElement(ref: Ref<RawRefElement> | RawRefElement): NormalElement {
  let raw = unref(ref)

  if (raw && '$el' in raw) {
    raw = raw.$el as Element
  }

  if (raw instanceof HTMLElement || raw instanceof SVGElement) {
    return raw
  }

  return null
}

export function isEventWithModifier(event: MouseEvent | KeyboardEvent): boolean {
  return (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey ||
    // Нажатие на колесико мыши
    (event instanceof MouseEvent && event.button === 1)
  )
}

export function getMapValueWithDefaults<K, V>(
  map: Map<K, V>,
  key: NoInfer<K>,
  defaults: NoInfer<V>
): V {
  if (map.has(key)) {
    return map.get(key) as V
  }

  map.set(key, defaults)
  return defaults
}

// export function isElementInViewport(viewport: HTMLElement, element: HTMLElement): boolean {
//   const viewportRect = viewport.getBoundingClientRect()
//   const elementRect = element.getBoundingClientRect()
//
//   return elementRect.top >= viewportRect.top && elementRect.bottom <= viewportRect.bottom
// }
