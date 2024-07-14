import { describe, expect, test } from 'vitest'
import * as History from 'model/History'

describe(History.insert.name, () => {
  const insert = (
    history: Array<number | [number, number]>,
    items: number[]
  ) => {
    const actualHistory = history.map((id) => (
      Array.isArray(id) ? History.toGap(id[0], id[1]) : History.toItem(id, null)
    ))
    const actualItems = items.map((id) => History.toItem(id, null))

    History.insert(actualHistory, actualItems)

    return actualHistory.map((node) => (
      node.kind === 'Gap' ? [node.fromId, node.toId] : node.id
    )) satisfies typeof history
  }

  test('insert empty', () => {
    expect(insert([], [])).toEqual([])
  })

  test('insert with upper gap', () => {
    expect(insert([[1, 2], 3, 4], [1]))
      .toEqual([1, [2, 2], 3, 4])
    expect(insert([[1, 2], 3, 4], [2]))
      .toEqual([[1, 1], 2, 3, 4])
    expect(insert([[1, 2], 3, 4], [3]))
      .toEqual([[1, 2], 3, 4])
    expect(insert([[1, 2], 3, 4], [4]))
      .toEqual([[1, 2], 3, 4])

    expect(insert([[1, 2], 3, 4], [1, 2]))
      .toEqual([1, 2, 3, 4])
    expect(insert([[1, 2], 3, 4], [2, 3]))
      .toEqual([[1, 1], 2, 3, 4])
    expect(insert([[1, 2], 3, 4], [3, 4]))
      .toEqual([[1, 2], 3, 4])

    expect(insert([[1, 2], 3, 4], [1, 2, 3]))
      .toEqual([1, 2, 3, 4])
    expect(insert([[1, 2], 3, 4], [2, 3, 4]))
      .toEqual([[1, 1], 2, 3, 4])

    expect(insert([[1, 2], 3, 4], [1, 2, 3, 4]))
      .toEqual([1, 2, 3, 4])
  })

  test('insert with lower gap', () => {
    expect(insert([1, 2, [3, 4]], [1]))
      .toEqual([1, 2, [3, 4]])
    expect(insert([1, 2, [3, 4]], [2]))
      .toEqual([1, 2, [3, 4]])
    expect(insert([1, 2, [3, 4]], [3]))
      .toEqual([1, 2, 3, [4, 4]])
    expect(insert([1, 2, [3, 4]], [4]))
      .toEqual([1, 2, [3, 3], 4])

    expect(insert([1, 2, [3, 4]], [1, 2]))
      .toEqual([1, 2, [3, 4]])
    expect(insert([1, 2, [3, 4]], [2, 3]))
      .toEqual([1, 2, 3, [4, 4]])
    expect(insert([1, 2, [3, 4]], [3, 4]))
      .toEqual([1, 2, 3, 4])

    expect(insert([1, 2, [3, 4]], [1, 2, 3]))
      .toEqual([1, 2, 3, [4, 4]])
    expect(insert([1, 2, [3, 4]], [2, 3, 4]))
      .toEqual([1, 2, 3, 4])

    expect(insert([1, 2, [3, 4]], [1, 2, 3, 4]))
      .toEqual([1, 2, 3, 4])
  })

  test('insert between two gaps', () => {
    expect(insert([[1, 2], 3, [4, 5]], [3]))
      .toEqual([[1, 2], 3, [4, 5]])

    expect(insert([[1, 2], 3, [4, 5]], [2, 3]))
      .toEqual([[1, 1], 2, 3, [4, 5]])
    expect(insert([[1, 2], 3, [4, 5]], [3, 4]))
      .toEqual([[1, 2], 3, 4, [5, 5]])

    expect(insert([[1, 2], 3, [4, 5]], [2, 3, 4]))
      .toEqual([[1, 1], 2, 3, 4, [5, 5]])

    expect(insert([[1, 2], 3, [4, 5]], [1, 2, 3, 4, 5]))
      .toEqual([1, 2, 3, 4, 5])
  })

  test('insert inside the only gap', () => {
    expect(insert([[1, 1]], [1]))
      .toEqual([1])

    expect(insert([[1, 3]], [1]))
      .toEqual([1, [2, 3]])
    expect(insert([[1, 3]], [2]))
      .toEqual([[1, 1], 2, [3, 3]])
    expect(insert([[1, 3]], [3]))
      .toEqual([[1, 2], 3])

    expect(insert([[1, 3]], [1, 2]))
      .toEqual([1, 2, [3, 3]])
    expect(insert([[1, 3]], [2, 3]))
      .toEqual([[1, 1], 2, 3])

    expect(insert([1, 3], [1, 2, 3]))
      .toEqual([1, 2, 3])
  })

  test('insert after history', () => {
    expect(insert([], [1]))
      .toEqual([1])

    expect(insert([[1, 1]], [2]))
      .toEqual([[1, 1], 2])

    expect(insert([[1, 1]], [1, 2]))
      .toEqual([1, 2])

    expect(insert([[1, 2]], [2, 3]))
      .toEqual([[1, 1], 2, 3])
    expect(insert([[1, 2]], [3, 4]))
      .toEqual([[1, 2], 3, 4])
  })
})
