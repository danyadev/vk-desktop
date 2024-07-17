import { describe, expect, test } from 'vitest'
import * as History from 'model/History'

type SimpleHistory = Array<number | [number, number]>

const simplifyHistory = (history: History.History<null>): SimpleHistory => {
  return history.map((node) => (
    node.kind === 'Gap' ? [node.fromId, node.toId] : node.id
  ))
}

const restoreHistory = (simpleHistory: SimpleHistory): History.History<null> => {
  return simpleHistory.map((id) => (
    Array.isArray(id) ? History.toGap(id[0], id[1]) : History.toItem(id, null)
  ))
}

describe(History.around.name, () => {
  const around = (
    history: SimpleHistory,
    aroundId: number
  ) => {
    const {
      items,
      matchedAroundId,
      gapBefore,
      gapAround,
      gapAfter
    } = History.around(restoreHistory(history), aroundId)

    return {
      items: items.map((node) => node.id),
      around: matchedAroundId === aroundId ? undefined : matchedAroundId,
      gapBefore: gapBefore && [gapBefore.fromId, gapBefore.toId] as const,
      gapAround: gapAround && [gapAround.fromId, gapAround.toId] as const,
      gapAfter: gapAfter && [gapAfter.fromId, gapAfter.toId] as const
    }
  }

  test('around node', () => {
    expect(around([], 1))
      .toEqual({ items: [] })

    expect(around([2], 1))
      .toEqual({ items: [2], around: 2 })
    expect(around([2], 2))
      .toEqual({ items: [2] })
    expect(around([2], 3))
      .toEqual({ items: [2], around: 2 })

    expect(around([2, 4], 1))
      .toEqual({ items: [2, 4], around: 2 })
    expect(around([2, 4], 2))
      .toEqual({ items: [2, 4] })
    expect(around([2, 4], 3))
      .toEqual({ items: [2, 4], around: 4 })
    expect(around([2, 4], 4))
      .toEqual({ items: [2, 4] })
    expect(around([2, 4], 5))
      .toEqual({ items: [2, 4], around: 4 })
  })

  test('around gap', () => {
    expect(around([[2, 4]], 1))
      .toEqual({ items: [], gapAround: [2, 4], around: 2 })
    expect(around([[2, 4]], 2))
      .toEqual({ items: [], gapAround: [2, 4] })
    expect(around([[2, 4]], 3))
      .toEqual({ items: [], gapAround: [2, 4] })
    expect(around([[2, 4]], 4))
      .toEqual({ items: [], gapAround: [2, 4] })
    expect(around([[2, 4]], 5))
      .toEqual({ items: [], gapAround: [2, 4], around: 4 })
  })

  test('between gap and node', () => {
    expect(around([1, [2, 3]], 1))
      .toEqual({ items: [1], gapAfter: [2, 3] })
    expect(around([1, [2, 3]], 2))
      .toEqual({ items: [1], gapAfter: [2, 3], around: 1 })
    expect(around([1, [2, 3]], 3))
      .toEqual({ items: [], gapAround: [2, 3] })

    expect(around([[1, 2], 3], 1))
      .toEqual({ items: [], gapAround: [1, 2] })
    expect(around([[1, 2], 3], 2))
      .toEqual({ items: [3], gapBefore: [1, 2], around: 3 })
    expect(around([[1, 2], 3], 3))
      .toEqual({ items: [3], gapBefore: [1, 2] })
  })

  test('between gap and node with empty zone', () => {
    expect(around([1, [3, 4]], 1))
      .toEqual({ items: [1], gapAfter: [3, 4] })
    expect(around([1, [3, 4]], 2))
      .toEqual({ items: [1], gapAfter: [3, 4], around: 1 })
    expect(around([1, [3, 4]], 3))
      .toEqual({ items: [1], gapAfter: [3, 4], around: 1 })
    expect(around([1, [3, 4]], 4))
      .toEqual({ items: [], gapAround: [3, 4] })
    expect(around([1, [3, 4]], 5))
      .toEqual({ items: [], gapAround: [3, 4], around: 4 })

    expect(around([[1, 2], 4], 1))
      .toEqual({ items: [], gapAround: [1, 2] })
    expect(around([[1, 2], 4], 2))
      .toEqual({ items: [4], gapBefore: [1, 2], around: 4 })
    expect(around([[1, 2], 4], 3))
      .toEqual({ items: [4], gapBefore: [1, 2], around: 4 })
    expect(around([[1, 2], 4], 4))
      .toEqual({ items: [4], gapBefore: [1, 2] })
    expect(around([[1, 2], 4], 5))
      .toEqual({ items: [4], gapBefore: [1, 2], around: 4 })
  })
})

describe(History.findNode.name, () => {
  const findNode = (history: SimpleHistory, id: number) => {
    const result = History.findNode(restoreHistory(history), id)
    return result && simplifyHistory([result])[0]
  }

  test('find node', () => {
    expect(findNode([], 1))
      .toEqual(null)
    expect(findNode([2], 1))
      .toEqual(null)
    expect(findNode([2], 2))
      .toEqual(2)
    expect(findNode([2], 3))
      .toEqual(null)

    expect(findNode([1, 2, 3, 4, 5, 7], 4))
      .toEqual(4)
    expect(findNode([1, 2, 3, 4, 5, 7], 5))
      .toEqual(5)
    expect(findNode([1, 2, 3, 4, 5, 7], 6))
      .toEqual(null)
    expect(findNode([1, 2, 3, 4, 5, 7], 7))
      .toEqual(7)
  })

  test('find node between gaps', () => {
    expect(findNode([[1, 2], 3, [4, 5]], 2))
      .toEqual([1, 2])
    expect(findNode([[1, 2], 3, [4, 5]], 3))
      .toEqual(3)
    expect(findNode([[1, 2], 3, [4, 5]], 4))
      .toEqual([4, 5])
  })

  test('find node between gaps with empty zones', () => {
    expect(findNode([[1, 1], 3, [5, 5]], 1))
      .toEqual([1, 1])
    expect(findNode([[1, 1], 3, [5, 5]], 2))
      .toEqual(null)
    expect(findNode([[1, 1], 3, [5, 5]], 3))
      .toEqual(3)
    expect(findNode([[1, 1], 3, [5, 5]], 4))
      .toEqual(null)
    expect(findNode([[1, 1], 3, [5, 5]], 5))
      .toEqual([5, 5])
  })

  test('find gap', () => {
    expect(findNode([[2, 4]], 1))
      .toEqual(null)
    expect(findNode([[2, 4]], 2))
      .toEqual([2, 4])
    expect(findNode([[2, 4]], 3))
      .toEqual([2, 4])
    expect(findNode([[2, 4]], 4))
      .toEqual([2, 4])
    expect(findNode([[2, 4]], 5))
      .toEqual(null)
  })

  test('find gap with empty zones', () => {
    expect(findNode([2, [4, 4], 6], 1))
      .toEqual(null)
    expect(findNode([2, [4, 4], 6], 2))
      .toEqual(2)
    expect(findNode([2, [4, 4], 6], 3))
      .toEqual(null)
    expect(findNode([2, [4, 4], 6], 4))
      .toEqual([4, 4])
    expect(findNode([2, [4, 4], 6], 5))
      .toEqual(null)
    expect(findNode([2, [4, 4], 6], 6))
      .toEqual(6)
    expect(findNode([2, [4, 4], 6], 7))
      .toEqual(null)
  })
})

describe(History.removeNode.name, () => {
  const removeNode = (history: SimpleHistory, id: number, removeWholeGap?: boolean) => {
    const actualHistory = restoreHistory(history)
    History.removeNode(actualHistory, id, removeWholeGap)
    return simplifyHistory(actualHistory)
  }

  test('remove node', () => {
    expect(removeNode([2], 1))
      .toEqual([2])
    expect(removeNode([2], 2))
      .toEqual([])
    expect(removeNode([2], 3))
      .toEqual([2])

    expect(removeNode([2, 3, 4], 1))
      .toEqual([2, 3, 4])
    expect(removeNode([2, 3, 4], 2))
      .toEqual([3, 4])
    expect(removeNode([2, 3, 4], 3))
      .toEqual([2, 4])
    expect(removeNode([2, 3, 4], 4))
      .toEqual([2, 3])
    expect(removeNode([2, 3, 4], 5))
      .toEqual([2, 3, 4])
  })

  test('remove gap', () => {
    expect(removeNode([[2, 2]], 1))
      .toEqual([[2, 2]])
    expect(removeNode([[2, 2]], 2))
      .toEqual([])
    expect(removeNode([[2, 2]], 2, true))
      .toEqual([])
    expect(removeNode([[2, 2]], 3))
      .toEqual([[2, 2]])

    expect(removeNode([[2, 4]], 1))
      .toEqual([[2, 4]])
    expect(removeNode([[2, 4]], 2))
      .toEqual([[3, 4]])
    expect(removeNode([[2, 4]], 3))
      .toEqual([[2, 4]])
    expect(removeNode([[2, 4]], 4))
      .toEqual([[2, 3]])
    expect(removeNode([[2, 4]], 5))
      .toEqual([[2, 4]])
  })

  test('remove the whole gap', () => {
    expect(removeNode([[2, 4]], 2, true))
      .toEqual([])
    expect(removeNode([[2, 4]], 3, true))
      .toEqual([])
    expect(removeNode([[2, 4]], 4, true))
      .toEqual([])

    expect(removeNode([1, [2, 4], 5], 2, true))
      .toEqual([1, 5])
    expect(removeNode([1, [2, 4], 5], 3, true))
      .toEqual([1, 5])
    expect(removeNode([1, [2, 4], 5], 4, true))
      .toEqual([1, 5])
  })
})

describe(History.insert.name, () => {
  const insert = (
    history: SimpleHistory,
    items: number[],
    { up = true, down = true, aroundId = 0 } = {}
  ) => {
    const actualHistory = restoreHistory(history)
    const actualItems = items.map((id) => History.toItem(id, null))

    History.insert(actualHistory, actualItems, { aroundId, up, down })

    return simplifyHistory(actualHistory)
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
