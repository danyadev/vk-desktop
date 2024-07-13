import { describe, expect, test } from 'vitest'
import * as History from 'model/History'

describe(History.insert.name, () => {
  const insert = (
    history: Array<number | [number, number]>,
    items: number[],
    { up = false, down = false } = {}
  ) => {
    const actualHistory = history.map((id) => (
      Array.isArray(id) ? History.toGap(id[0], id[1]) : History.toItem(id, null)
    ))
    const actualItems = items.map((id) => History.toItem(id, null))

    History.insert(actualHistory, actualItems, { up, down })

    return actualHistory.map((node) => (
      node.kind === 'Gap' ? [node.fromId, node.toId] : node.id
    )) satisfies typeof history
  }

  test('insert empty', () => {
    expect(insert([], [])).toEqual([])
  })

  test.skip('insert before / after node', () => {
    expect(insert([[3, 4]], [1, 2]))
      .toEqual([1, 2, [3, 4]])
    expect(insert([3, 4], [1, 2]))
      .toEqual([1, 2, 3, 4])

    expect(insert([[1, 2]], [3, 4]))
      .toEqual([[1, 2], 3, 4])
    expect(insert([1, 2], [3, 4]))
      .toEqual([1, 2, 3, 4])
  })

  test.todo('insert with intersection with nodes')
  test.todo('insert inside the only gap')
})

/*
describe('mergeNode', () => {
  test('node or gap into empty history', () => {
    expect(
      History.mergeNode([], createNode(1))
    ).toEqual(
      [createNode(1)]
    )

    expect(
      History.mergeNode([], createGap(1, 2))
    ).toEqual(
      [createGap(1, 2)]
    )
  })

  test('gap into node', () => {
    expect(
      History.mergeNode([createNode(2)], createGap(3, 5))
    ).toEqual(
      [createNode(2), createGap(3, 5)]
    )
    expect(
      History.mergeNode([createNode(3)], createGap(3, 5))
    ).toEqual(
      [createGap(3, 5)]
    )
    expect(
      History.mergeNode([createNode(4)], createGap(3, 5))
    ).toEqual(
      [createGap(3, 5)]
    )
    expect(
      History.mergeNode([createNode(5)], createGap(3, 5))
    ).toEqual(
      [createGap(3, 5)]
    )
    expect(
      History.mergeNode([createNode(6)], createGap(3, 5))
    ).toEqual(
      [createGap(3, 5), createNode(6)]
    )
  })

  test('gap into gap', () => {
    // before
    expect(
      History.mergeNode([createGap(3, 5)], createGap(1, 1))
    ).toEqual(
      [createGap(1, 1), createGap(3, 5)]
    )

    // intersections
    expect(
      History.mergeNode([createGap(3, 5)], createGap(1, 2))
    ).toEqual(
      [createGap(1, 5)]
    )
    expect(
      History.mergeNode([createGap(3, 5)], createGap(2, 3))
    ).toEqual(
      [createGap(2, 5)]
    )
    expect(
      History.mergeNode([createGap(3, 5)], createGap(3, 4))
    ).toEqual(
      [createGap(3, 5)]
    )
    expect(
      History.mergeNode([createGap(3, 5)], createGap(4, 5))
    ).toEqual(
      [createGap(3, 5)]
    )
    expect(
      History.mergeNode([createGap(3, 5)], createGap(5, 6))
    ).toEqual(
      [createGap(3, 6)]
    )
    expect(
      History.mergeNode([createGap(3, 5)], createGap(6, 7))
    ).toEqual(
      [createGap(3, 7)]
    )

    // after
    expect(
      History.mergeNode([createGap(3, 5)], createGap(7, 8))
    ).toEqual(
      [createGap(3, 5), createGap(7, 8)]
    )

    // gap > history
    expect(
      History.mergeNode([createGap(3, 5)], createGap(2, 6))
    ).toEqual(
      [createGap(2, 6)]
    )
  })

  test('gap into nodes', () => {
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(1, 1))
    ).toEqual(
      [createGap(1, 1), createNode(2), createNode(3)]
    )
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(1, 2))
    ).toEqual(
      [createGap(1, 2), createNode(3)]
    )
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(1, 3))
    ).toEqual(
      [createGap(1, 3)]
    )
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(1, 4))
    ).toEqual(
      [createGap(1, 4)]
    )
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(2, 3))
    ).toEqual(
      [createGap(2, 3)]
    )
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(3, 4))
    ).toEqual(
      [createNode(2), createGap(3, 4)]
    )
    expect(
      History.mergeNode([createNode(2), createNode(3)], createGap(4, 5))
    ).toEqual(
      [createNode(2), createNode(3), createGap(4, 5)]
    )
  })

  test('gap into gaps and nodes', () => {
    // [gap, node]
    expect(
      History.mergeNode([createGap(1, 10), createNode(11)], createGap(9, 10))
    ).toEqual(
      [createGap(1, 10), createNode(11)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(11)], createGap(10, 11))
    ).toEqual(
      [createGap(1, 11)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(11)], createGap(11, 12))
    ).toEqual(
      [createGap(1, 12)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(11)], createGap(12, 13))
    ).toEqual(
      [createGap(1, 10), createNode(11), createGap(12, 13)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(11)], createGap(9, 12))
    ).toEqual(
      [createGap(1, 12)]
    )

    // [gap, *, node]
    expect(
      History.mergeNode([createGap(1, 10), createNode(12)], createGap(9, 10))
    ).toEqual(
      [createGap(1, 10), createNode(12)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(12)], createGap(10, 11))
    ).toEqual(
      [createGap(1, 11), createNode(12)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(12)], createGap(11, 12))
    ).toEqual(
      [createGap(1, 12)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(12)], createGap(12, 13))
    ).toEqual(
      [createGap(1, 10), createGap(12, 13)]
    )
    expect(
      History.mergeNode([createGap(1, 10), createNode(12)], createGap(9, 13))
    ).toEqual(
      [createGap(1, 13)]
    )
  })

  test('node into nodes', () => {
    expect(
      History.mergeNode([createNode(1)], createNode(1))
    ).toEqual(
      [createNode(1)]
    )
    expect(
      History.mergeNode([createNode(1), createNode(3)], createNode(2))
    ).toEqual(
      [createNode(1), createNode(2), createNode(3)]
    )
  })

  test('node into gap', () => {
    // replace
    expect(
      History.mergeNode([createGap(1, 1)], createNode(1))
    ).toEqual(
      [createNode(1)]
    )
    // into start
    expect(
      History.mergeNode([createGap(1, 2)], createNode(1))
    ).toEqual(
      [createNode(1), createGap(2, 2)]
    )
    // into end
    expect(
      History.mergeNode([createGap(1, 2)], createNode(2))
    ).toEqual(
      [createGap(1, 1), createNode(2)]
    )
    // in between
    expect(
      History.mergeNode([createGap(1, 3)], createNode(2))
    ).toEqual(
      [createGap(1, 1), createNode(2), createGap(3, 3)]
    )
  })
})
*/
