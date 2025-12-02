export type History<T> = Array<Node<T>>

export type Node<T> = Item<T> | Gap

export type Item<T> = {
  kind: 'Item'
  id: number
  item: T
}

export type Gap = {
  kind: 'Gap'
  fromId: number
  toId: number
}

export function toGap(fromId: number, toId: number): Gap {
  return {
    kind: 'Gap',
    fromId,
    toId
  }
}

export function toItem<T>(id: number, item: T): Item<T> {
  return {
    kind: 'Item',
    id,
    item
  }
}

/**
 * Возвращает последний доступный не-гэп элемент истории
 */
export function lastItem<T>(history: History<T>): T | undefined {
  const last = history.at(-1)

  if (last && last.kind !== 'Gap') {
    return last.item
  }

  return undefined
}

/**
 * Возвращает часть истории, непрерывно доступной вокруг aroundId,
 * то есть список элементов до первого гэпа с обеих сторон от aroundId
 */
export function around<T>(
  history: History<T>,
  aroundId: number,
  preferNeighborSliceAtGapBoundary = true
): {
  items: Array<Item<T>>
  effectiveAroundId: number
  gapBefore?: Gap
  gapAround?: Gap
  gapAfter?: Gap
} {
  const aroundIndex = findNode(history, aroundId, true)
  const aroundNode = aroundIndex !== null && history[aroundIndex]

  /**
   * В подавляющем большинстве случаев мы найдем гэп или элемент.
   * Если не нашли, значит либо попали в удаленный элемент, либо ткнули за пределы истории
   */
  if (!aroundNode) {
    const lastNode = history.at(-1)

    // Пустая история - пустой ответ
    if (!lastNode) {
      return {
        items: [],
        effectiveAroundId: aroundId
      }
    }

    // Если элемент находится после истории, вернем слайс в конце истории
    const lastNodeEndBoundary = lastNode.kind === 'Gap' ? lastNode.toId : lastNode.id
    if (aroundId > lastNodeEndBoundary) {
      return around(history, lastNodeEndBoundary)
    }

    // Иначе, элемент находится где-то в пустой зоне истории, находим первый элемент рядом с ним
    const nextToAroundIndex = binarySearch(history, plainToBinarySearchAdapter((node) => {
      const nodeStartBoundary = node.kind === 'Gap' ? node.fromId : node.id
      return nodeStartBoundary > aroundId
    }))

    if (nextToAroundIndex === null) {
      // По сути невозможный кейс, возвращаем пустоту
      return {
        items: [],
        effectiveAroundId: aroundId
      }
    }

    const nextToAroundNode = history[nextToAroundIndex]!
    const prevToAroundNode = history[nextToAroundIndex - 1]

    const nodeStartBoundary = nextToAroundNode.kind === 'Gap'
      ? nextToAroundNode.fromId
      : nextToAroundNode.id
    // Предпочитаем отображать более актуальную историю
    // aroundId: 5; [4-, 6+] -> around 6+
    if (nextToAroundNode.kind !== 'Gap') {
      return around(history, nodeStartBoundary)
    }
    // Но если рядом оказалась только прошлая история, возвращаем ее
    // aroundId: 5; [4-, [6+, n]] -> around 4-
    if (prevToAroundNode && prevToAroundNode.kind !== 'Gap') {
      return around(history, prevToAroundNode.id)
    }
    // Иначе отдаем гэп более актуальной истории
    // aroundId: 5; [[n, 4-]?, [6+, n]] -> gap [6+, n]
    return {
      items: [],
      gapAround: nextToAroundNode,
      effectiveAroundId: nodeStartBoundary
    }
  }

  if (aroundNode.kind === 'Gap') {
    if (preferNeighborSliceAtGapBoundary) {
      /**
       * Если мы попались на граничный гэп рядом с историей, то отдадим эту историю
       */
      const prevNode = history[aroundIndex - 1]
      if (prevNode && prevNode.kind !== 'Gap' && aroundNode.fromId === aroundId) {
        return around(history, prevNode.id)
      }

      const nextNode = history[aroundIndex + 1]
      if (nextNode && nextNode.kind !== 'Gap' && aroundNode.toId === aroundId) {
        return around(history, nextNode.id)
      }
    }

    return {
      items: [],
      gapAround: aroundNode,
      effectiveAroundId: aroundId
    }
  }

  let gapBefore: Gap | undefined
  let gapBeforeIndex = aroundIndex
  while (--gapBeforeIndex >= 0) {
    const node = history[gapBeforeIndex]!
    if (node.kind === 'Gap') {
      gapBefore = node
      break
    }
  }

  let gapAfter: Gap | undefined
  let gapAfterIndex = aroundIndex
  while (++gapAfterIndex < history.length) {
    const node = history[gapAfterIndex]!
    if (node.kind === 'Gap') {
      gapAfter = node
      break
    }
  }

  return {
    items: history.slice(gapBeforeIndex + 1, gapAfterIndex) as Array<Item<T>>,
    effectiveAroundId: aroundId,
    gapBefore,
    gapAfter
  }
}

/**
 * Вставляет в историю непрерывную часть истории
 *
 * При реализации закладывалась идея, что история консистентна:
 * - если между нодами есть пустое пространство, значит элементы в этой области недостижимы
 * - при запросе истории из апи можно спокойно учитывать это и уменьшать количество загружаемых
 *   элементов до границ гэпов
 * - однако допускается ситуация, когда элемент считался удаленным и его исключили из истории,
 *   а затем приходит insert с этим элементом
 */
export function insert<T>(
  history: History<T>,
  items: Array<Item<T>>,
  hasMore: { up: boolean, down: boolean, aroundId: number }
) {
  const firstItem = items[0]
  const lastItem = items.at(-1)

  if (!firstItem || !lastItem) {
    // Если при загрузке истории оказалось, что истории в этом гэпе нет, то нужно его удалить
    if (!hasMore.up || !hasMore.down) {
      removeNode(history, hasMore.aroundId, true)
    }

    return
  }

  // Индексы первой и последней нод, находящихся в зоне вставляемой истории
  let startIndex = binarySearch(history, plainToBinarySearchAdapter((node) => {
    /**
     * Если нода пересекается с первым вставляемым элементом или находится дальше него,
     * то первая такая найденная нода является первой пересекаемой со вставляемыми элементами.
     *
     * Однако найденная нода может находиться позже последнего вставляемого элемента,
     * но это возможно только в случае, когда элемент был удален и теперь восстановился
     */
    const nodeEndBoundary = node.kind === 'Gap' ? node.toId : node.id
    return nodeEndBoundary >= firstItem.id
  }))

  let endIndex = binarySearch(history, plainToBinarySearchAdapter((node, index) => {
    if (startIndex === null || index < startIndex) {
      return false
    }

    const nextNode = history[index + 1]
    const nextNodeStartBoundary =
      nextNode ? (nextNode.kind === 'Gap' ? nextNode.fromId : nextNode.id) : 0
    // Если следующей ноды нет или она начинается после последнего элемента,
    // то текущая нода - последняя пересекаемая вставляемыми элементами
    return !nextNode || nextNodeStartBoundary > lastItem.id
  }))

  // Если не нашлась стартовая нода, значит вставляемые элементы находятся после всей истории
  if (startIndex === null || endIndex === null) {
    history.push(...items)
    return
  }

  const startNode = history[startIndex]!
  const endNode = history[endIndex]!

  // Если стартовая нода оказалась дальше последнего элемента, значит вставляемые элементы
  // находятся перед стартовой нодой, просто вставляем их перед нодой
  const startNodeStartBoundary = startNode.kind === 'Gap' ? startNode.fromId : startNode.id
  if (startNodeStartBoundary > lastItem.id) {
    // В таком случае начальная нода = конечная нода, а мы вставляем элементы
    // после prevStartNode, но перед startNode, то есть даже без пересечений
    const prevStartNode = history[startIndex - 1]
    const deleteTopGap = prevStartNode?.kind === 'Gap' && !hasMore.up
    const deleteBottomGap = startNode.kind === 'Gap' && !hasMore.down

    const fromIndex = deleteTopGap ? startIndex - 1 : startIndex
    const deleteCount = Number(deleteTopGap) + Number(deleteBottomGap)

    history.splice(fromIndex, deleteCount, ...items)
    return
  }

  const newNodes: History<T> = []

  if (hasMore.up) {
    // Если стартовый гэп начался до вставляемых элементов, то надо сохранить кусок гэпа до нас
    if (startNode.kind === 'Gap' && startNode.fromId < firstItem.id) {
      newNodes.push(toGap(startNode.fromId, firstItem.id - 1))
    }
  } else {
    // Если выше больше нет истории, удаляем потенциальный гэп выше
    const prevNode = history[startIndex - 1]
    if (prevNode?.kind === 'Gap') {
      startIndex--
    }
  }

  newNodes.push(...items)

  if (hasMore.down) {
    // Если конечный гэп продолжается после нас, то нужно сохранить кусок гэпа после нас
    if (endNode.kind === 'Gap' && endNode.toId > lastItem.id) {
      newNodes.push(toGap(lastItem.id + 1, endNode.toId))
    }
  } else {
    // Если ниже больше нет истории, удаляем потенциальный гэп ниже
    const nextNode = history[endIndex + 1]
    if (nextNode?.kind === 'Gap') {
      endIndex++
    }
  }

  history.splice(startIndex, endIndex - startIndex + 1, ...newNodes)
}

enum CompareState {
  FOUND = 0,
  TO_THE_LEFT = 1,
  TO_THE_RIGHT = -1
}

function binarySearch<T>(
  history: History<T>,
  comparator: (node: Node<T>, index: number, array: History<T>) => CompareState
): number | null {
  let left = 0
  let right = history.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const node = history[mid]
    if (!node) {
      return null
    }

    const compared = comparator(node, mid, history)

    if (compared === CompareState.FOUND) {
      return mid
    } else if (compared === CompareState.TO_THE_RIGHT) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return null
}

/**
 * Адаптер для использования алгоритма обычного поиска через for за O(n)
 * в бинарном поиске за O(log2(N)).
 * Может быть использован только если мы ищем точку в истории,
 * начиная с которой и до конца массива predicate будет возвращать true.
 *
 * Например, для массива [1, 2, 3, 4, 5, 6] predicate = (el) => el > 3
 * будет возвращать всегда true начиная с элемента со значением 4,
 * которое мы и хотим найти
 */
function plainToBinarySearchAdapter<T>(
  predicate: (element: T, index: number, array: T[]) => boolean
) {
  return (element: T, index: number, array: T[]): CompareState => {
    if (!predicate(element, index, array)) {
      // Элемент еще не найден, идем дальше
      return CompareState.TO_THE_RIGHT
    }

    if (index === 0) {
      // Элемент найден и он первый в массиве
      return CompareState.FOUND
    }

    const prevElement = array[index - 1]!
    if (predicate(prevElement, index - 1, array)) {
      // Предыдущий элемент тоже подошел, значит мы запрыгнули дальше нужного
      return CompareState.TO_THE_LEFT
    }

    // Предыдущий элемент не подошел, а текущий подошел, значит нашли что искали
    return CompareState.FOUND
  }
}

/**
 * Находит ноду в истории двоичным поиском
 */
export function findNode<T>(history: History<T>, id: number): Node<T> | null
export function findNode<T>(history: History<T>, id: number, asIndex: true): number | null
export function findNode<T>(
  history: History<T>,
  id: number,
  asIndex?: true
): Node<T> | number | null {
  const index = binarySearch(history, (node) => {
    const nodeStart = node.kind === 'Gap' ? node.fromId : node.id
    const nodeEnd = node.kind === 'Gap' ? node.toId : node.id

    if (id > nodeEnd) {
      return CompareState.TO_THE_RIGHT
    }
    if (id < nodeStart) {
      return CompareState.TO_THE_LEFT
    }
    return CompareState.FOUND
  })

  if (asIndex || index === null) {
    return index
  }

  return history[index] ?? null
}

/**
 * Удаляет ноду из истории
 *
 * - если это элемент, то удаляем его;
 * - если это гэп с одним элементом, то удаляем его;
 * - если это гэп и removeWholeGap = true, то удаляем его;
 * - если это гэп, граница которого - удаляемый элемент, то уменьшаем границу;
 * - если удаляемый элемент внутри гэпа, то игнорируем.
 */
export function removeNode<T>(history: History<T>, id: number, removeWholeGap = false) {
  const nodeIndex = findNode(history, id, true)
  const node = nodeIndex !== null && history[nodeIndex]

  if (!node) {
    return
  }

  if (node.kind !== 'Gap' || node.fromId === node.toId || removeWholeGap) {
    history.splice(nodeIndex, 1)
    return
  }

  if (node.fromId === id) {
    node.fromId++
    return
  }

  if (node.toId === id) {
    node.toId--
  }
}

/**
 * Удаляет историю вплоть до элемента upToId включительно
 */
export function clearHistory<T>(history: History<T>, upToId: number) {
  const firstKeptNodeIndex = binarySearch(history, plainToBinarySearchAdapter((node) => {
    const nodeEnd = node.kind === 'Item' ? node.id : node.toId
    return nodeEnd > upToId
  }))

  const firstKeptNode = firstKeptNodeIndex !== null && history[firstKeptNodeIndex]
  if (!firstKeptNode) {
    // Нет оставшихся нод
    history.length = 0
    return
  }

  // Удаляем все ноды перед оставшимися
  history.splice(0, firstKeptNodeIndex)

  // Если удаляемая часть элементов частично задевает гэп, сдвигаем его границу
  if (firstKeptNode.kind === 'Gap' && firstKeptNode.fromId <= upToId) {
    firstKeptNode.fromId = upToId + 1
  }
}
