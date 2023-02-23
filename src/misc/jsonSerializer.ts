import { isObject } from 'misc/utils'

export function serializeJson(value: unknown) {
  return JSON.stringify(value, stringifyReplacer)
}

export function deserializeJson<T = unknown>(json: string) {
  return JSON.parse(json, parseReviver) as T
}

type TypedValue =
  | { _type: 'map', value: Array<[unknown, unknown]> }
  | { _type: 'set', value: unknown[] }
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
    } as TypedValue
  }

  if (value instanceof Set) {
    return {
      _type: 'set',
      value: Array.from(value.values())
    } as TypedValue
  }

  if (isObject(value) && '_type' in value) {
    return {
      _type: 'escaped-value',
      value
    } as TypedValue
  }

  return value
}

function parseReviver(key: string, value: unknown) {
  if (!isTypedValue(value)) {
    return value
  }

  switch (value._type) {
    case 'map':
      return new Map(value.value)
    case 'set':
      return new Set(value.value)
    case 'escaped-value':
      return value.value
  }
}
