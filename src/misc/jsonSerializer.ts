import { isObject } from 'misc/utils'

const undefinedMarker = Symbol('undefined')

export function serializeJson(value: unknown) {
  return JSON.stringify(value, stringifyReplacer)
}

export function deserializeJson<T = unknown>(json: string) {
  const value: unknown = JSON.parse(json, parseReviver)
  return (value === undefinedMarker ? undefined : value) as T
}

type TypedValue =
  | { _type: 'map', value: Array<[unknown, unknown]> }
  | { _type: 'set', value: unknown[] }
  | { _type: 'undefined', value: null }
  | { _type: 'escaped-value', value: unknown }

function isTypedValue(value: unknown): value is TypedValue {
  return (
    isObject(value) &&
    '_type' in value &&
    'value' in value
  )
}

function stringifyReplacer(key: string, value: unknown) {
  if (value instanceof Map) {
    return {
      _type: 'map',
      value: Array.from(value.entries())
    } satisfies TypedValue
  }

  if (value instanceof Set) {
    return {
      _type: 'set',
      value: Array.from(value.values())
    } satisfies TypedValue
  }

  if (value === undefined) {
    return {
      _type: 'undefined',
      value: null
    } satisfies TypedValue
  }

  if (isObject(value) && '_type' in value) {
    return {
      _type: 'escaped-value',
      value
    } satisfies TypedValue
  }

  return value
}

function parseReviver(key: string, value: unknown) {
  if (isTypedValue(value)) {
    switch (value._type) {
      case 'map':
        return new Map(value.value)
      case 'set':
        return new Set(value.value)
      case 'undefined':
        // JSON.parse ignores undefined, so we can't just return it as is here
        return undefinedMarker
      case 'escaped-value':
        return value.value
    }
  }

  // The reviver processes children before their parents, so we can replace undefinedMarker back
  // to undefined without separate deep object traversal
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (child === undefinedMarker) {
        // @ts-expect-error we already know value is not null
        value[key] = undefined
      }
    }
  }

  return value
}
