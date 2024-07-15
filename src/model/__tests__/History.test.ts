import { describe, expect, test } from 'vitest'
import * as History from 'model/History'

describe(History.insert.name, () => {
  const insert = (
    history: Array<number | [number, number]>,
    items: number[],
    { up = true, down = true, aroundId = 0 } = {}
  ) => {
    const actualHistory = history.map((id) => (
      Array.isArray(id) ? History.toGap(id[0], id[1]) : History.toItem(id, null)
    ))
    const actualItems = items.map((id) => History.toItem(id, null))

    History.insert(actualHistory, actualItems, { aroundId, up, down })

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

    expect(insert([1, [2, 3], 4, [5, 8], 9, 10], [2, 3, 4, 5, 6, 7, 8, 9]))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
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

  test('insert with updating boundaries', () => {
    expect(insert([[1, 4]], [2, 3, 4], { up: false }))
      .toEqual([2, 3, 4])
    expect(insert([[1, 4]], [1, 2, 3], { down: false }))
      .toEqual([1, 2, 3])
    expect(insert([[1, 4]], [2, 3], { up: false, down: false }))
      .toEqual([2, 3])

    expect(insert([[1, 2], 3], [], { up: false, aroundId: 2 }))
      .toEqual([3])
    expect(insert([3, [4, 5]], [], { down: false, aroundId: 4 }))
      .toEqual([3])

    // В реальности мы грузим историю на основе существующего гэпа, поэтому мы не умеем
    // и собственно нам и не надо уметь удалять гэпы с двух сторон одновременно
    expect(insert([[1, 2], 3, [4, 5]], [], { up: false, down: false, aroundId: 2 }))
      .toEqual([3, [4, 5]])
    expect(insert([[1, 2], 3, [4, 5]], [], { up: false, down: false, aroundId: 4 }))
      .toEqual([[1, 2], 3])
  })

  /**
   * В случае с историей сообщений, могут быть не полностью удаленные сообщения,
   * которые могут быть восстановлены. В таком случае нужно уметь вставлять в айтемы в пустые зоны
   */

  test('insert in empty zones near items', () => {
    expect(insert([1], [2]))
      .toEqual([1, 2])
    expect(insert([2], [1]))
      .toEqual([1, 2])

    expect(insert([2], [1, 2]))
      .toEqual([1, 2])
    expect(insert([2], [2, 3]))
      .toEqual([2, 3])

    expect(insert([2], [1, 2, 3]))
      .toEqual([1, 2, 3])
  })

  test('insert in empty zones near gaps', () => {
    expect(insert([[1, 1]], [2]))
      .toEqual([[1, 1], 2])
    expect(insert([[2, 2]], [1]))
      .toEqual([1, [2, 2]])

    expect(insert([[2, 2]], [1, 2]))
      .toEqual([1, 2])
    expect(insert([[2, 2]], [2, 3]))
      .toEqual([2, 3])

    expect(insert([[2, 2]], [1, 2, 3]))
      .toEqual([1, 2, 3])

    expect(insert([[1, 2], [4, 5]], [3]))
      .toEqual([[1, 2], 3, [4, 5]])
    expect(insert([[1, 2], [4, 5]], [2, 3]))
      .toEqual([[1, 1], 2, 3, [4, 5]])
    expect(insert([[1, 2], [4, 5]], [3, 4]))
      .toEqual([[1, 2], 3, 4, [5, 5]])
    expect(insert([[1, 2], [4, 5]], [2, 4]))
      .toEqual([[1, 1], 2, 4, [5, 5]])
    expect(insert([[1, 2], [4, 5]], [2, 3, 4]))
      .toEqual([[1, 1], 2, 3, 4, [5, 5]])

    expect(insert([[1, 2], [4, 5]], [3], { up: false }))
      .toEqual([3, [4, 5]])
    expect(insert([[1, 2], [4, 5]], [3], { down: false }))
      .toEqual([[1, 2], 3])
    expect(insert([[1, 2], [4, 5]], [3], { up: false, down: false }))
      .toEqual([3])

    expect(insert([[1, 2], [4, 5]], [2, 3, 4], { up: false }))
      .toEqual([2, 3, 4, [5, 5]])
    expect(insert([[1, 2], [4, 5]], [2, 3, 4], { down: false }))
      .toEqual([[1, 1], 2, 3, 4])
    expect(insert([[1, 2], [4, 5]], [2, 3, 4], { up: false, down: false }))
      .toEqual([2, 3, 4])
  })
})
