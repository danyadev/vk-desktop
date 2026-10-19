import { describe, expect, test } from 'vitest'
import { deserializeJson, serializeJson } from 'misc/jsonSerializer'

const roundTrip = <T>(value: T): T => (
  deserializeJson<T>(serializeJson(value))
)

describe('jsonSerializer', () => {
  test('regular JSON values', () => {
    const value = {
      text: 'Hello',
      count: 42,
      enabled: true,
      empty: null,
      items: [1, 'two', { nested: false }]
    }

    expect(roundTrip(value)).toStrictEqual(value)
  })

  test('root undefined', () => {
    expect(roundTrip<unknown>(undefined)).toBeUndefined()
  })

  test('undefined properties and array elements', () => {
    const value = {
      replyMessage: undefined,
      nested: { editing: undefined },
      items: [undefined, null, { value: undefined }]
    }

    expect(roundTrip(value)).toStrictEqual(value)
  })

  test('Maps and Sets', () => {
    const value = {
      map: new Map([
        [1, 'one'],
        [2, 'two']
      ]),
      set: new Set([1, 2, 3])
    }

    expect(roundTrip(value)).toStrictEqual(value)
  })

  test('nested Maps, Sets and undefined values', () => {
    const value = new Map<unknown, unknown>([
      [undefined, new Set([1, undefined, 3])],
      ['nested', new Map([
        ['value', undefined],
        ['object', { replyMessage: undefined }]
      ])]
    ])

    expect(roundTrip(value)).toStrictEqual(value)
  })

  test('objects containing reserved _type properties', () => {
    const value = {
      _type: 'map',
      value: [['key', 'value']],
      nested: {
        _type: 'undefined',
        value: null
      },
      custom: {
        _type: 'something-else'
      }
    }

    expect(roundTrip(value)).toStrictEqual(value)
  })

  test('escaped objects inside collections', () => {
    const value = new Map([
      ['message', {
        _type: 'escaped-value',
        value: {
          _type: 'set',
          value: [1, undefined]
        }
      }]
    ])

    expect(roundTrip(value)).toStrictEqual(value)
  })
})
