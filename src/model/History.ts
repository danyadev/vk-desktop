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
 * Возвращает часть истории, непрерывно доступной вокруг aroundCmid,
 * то есть список сообщений до первого гэпа с обеих сторон от aroundCmid
 */
export function around<T>(history: History<T>, aroundId: number): {
  items: Array<Item<T>>
  gapBefore?: Gap
  gapAround?: Gap
  gapAfter?: Gap
} {
  const aroundIndex = history.findIndex((node) => (
    node.kind === 'Gap'
      ? aroundId >= node.fromId && aroundId <= node.toId
      : aroundId === node.id
  ))
  const aroundNode = history[aroundIndex]

  if (!aroundNode) {
    return {
      items: []
    }
  }

  if (aroundNode.kind === 'Gap') {
    /**
     * Если мы попались на граничный гэп рядом с историей, то отдадим эту историю
     */
    const prevNode = history[aroundIndex - 1]
    if (prevNode && prevNode.kind !== 'Gap' && aroundId - 1 === prevNode.id) {
      return around(history, prevNode.id)
    }

    const nextNode = history[aroundIndex + 1]
    if (nextNode && nextNode.kind !== 'Gap' && aroundId + 1 === nextNode.id) {
      return around(history, nextNode.id)
    }

    return {
      items: [],
      gapAround: aroundNode
    }
  }

  let gapBefore: Gap | undefined
  let gapBeforeIndex = aroundIndex - 1
  while (gapBeforeIndex >= 0 && !gapBefore) {
    const node = history[gapBeforeIndex]
    if (node && node.kind === 'Gap') {
      gapBefore = node
    } else {
      gapBeforeIndex--
    }
  }

  let gapAfter: Gap | undefined
  let gapAfterIndex = aroundIndex + 1
  while (gapAfterIndex < history.length && !gapAfter) {
    const node = history[gapAfterIndex]
    if (node && node.kind === 'Gap') {
      gapAfter = node
    } else {
      gapAfterIndex++
    }
  }

  return {
    items: history.slice(gapBeforeIndex + 1, gapAfterIndex) as Array<Item<T>>,
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
  hasMore: { up: boolean, down: boolean, aroundId?: number }
) {
  const firstItem = items[0]
  const lastItem = items.at(-1)

  if (!firstItem || !lastItem) {
    // Если при загрузке истории для гэпа оказалось, что истории больше нет,
    // то нужно удалить этот гэп
    if ((!hasMore.up || !hasMore.down) && hasMore.aroundId) {
      removeNode(history, hasMore.aroundId, true)
    }

    return
  }

  // Индексы первого и последнего нод, находящихся в зоне вставляемой истории
  let startIndex = -1
  let endIndex = -1

  for (let index = 0; index < history.length; index++) {
    const node = history[index]
    if (!node) {
      continue
    }

    if (startIndex === -1) {
      /**
       * Если нода пересекается с первым вставляемым элементом или находится дальше него,
       * то первая такая найденная нода является первой пересекаемой со вставляемыми элементами.
       *
       * Однако найденная нода может находиться позже последнего вставляемого элемента,
       * но это возможно только в случае, когда элемент был удален и теперь восстановился
       */
      const nodeEndBoundary = node.kind === 'Gap' ? node.toId : node.id
      if (nodeEndBoundary >= firstItem.id) {
        startIndex = index
      }
    }

    if (startIndex !== -1 && endIndex === -1) {
      const nextNode = history[index + 1]
      const nextNodeStartBoundary =
        nextNode ? (nextNode.kind === 'Gap' ? nextNode.fromId : nextNode.id) : 0
      // Если следующей ноды нет или она начинается после последнего элемента,
      // то текущая нода - последняя пересекаемая вставляемыми элементами
      if (!nextNode || nextNodeStartBoundary > lastItem.id) {
        endIndex = index
        break
      }
    }
  }

  const startNode = history[startIndex]
  const endNode = history[endIndex]

  // Если не нашлась стартовая нода, значит вставляемые элементы находятся после всей истории
  if (!startNode || !endNode) {
    history.push(...items)
    return
  }

  // Если стартовая нода оказалась дальше последнего сообщения, значит вставляемые айтемы
  // находятся перед стартовой ноды, просто вставляем их перед нодой
  const startNodeStartBoundary = startNode.kind === 'Gap' ? startNode.fromId : startNode.id
  if (startNode === endNode && startNodeStartBoundary > lastItem.id) {
    // Если сверху гэп, а мы поняли, что выше сообщений нет, то удаляем верхний гэп.
    // Так же, если снизу гэп, а мы поняли, что ниже сообщений нет, то удаляем нижний гэп
    const deleteTopGap = startNode.kind === 'Gap' && !hasMore.up
    const deleteBottomGap = endNode.kind === 'Gap' && !hasMore.down

    const fromIndex = deleteTopGap ? startIndex - 1 : startIndex
    let deleteCount = 0
    deleteTopGap && deleteCount++
    deleteBottomGap && deleteCount++

    history.splice(fromIndex, deleteCount, ...items)
    return
  }

  const newNodes: History<T> = []

  // Если стартовый гэп начался до вставляемых элементов, то надо сохранить кусок гэпа до нас
  if (hasMore.up && startNode && startNode.kind === 'Gap' && startNode.fromId < firstItem.id) {
    newNodes.push({ kind: 'Gap', fromId: startNode.fromId, toId: firstItem.id - 1 })
  }

  newNodes.push(...items)

  // Если конечный гэп продолжается после нас, то нужно сохранить кусок гэпа после нас
  if (hasMore.down && endNode && endNode.kind === 'Gap' && endNode.toId > lastItem.id) {
    newNodes.push({ kind: 'Gap', fromId: lastItem.id + 1, toId: endNode.toId })
  }

  history.splice(startIndex, endIndex - startIndex + 1, ...newNodes)
}

/**
 * Находит ноду в истории двоичным поиском
 */
function findNode<T>(history: History<T>, id: number): Node<T> | null
function findNode<T>(history: History<T>, id: number, asIndex: true): number | null
function findNode<T>(
  history: History<T>,
  id: number,
  asIndex?: true
): Node<T> | number | null {
  let left = 0
  let right = history.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const node = history[mid]
    if (!node) {
      return null
    }

    const nodeStart = node.kind === 'Gap' ? node.fromId : node.id
    const nodeEnd = node.kind === 'Gap' ? node.toId : node.id

    if (id >= nodeStart && id <= nodeEnd) {
      return asIndex ? mid : node
    } else if (nodeEnd < id) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return null
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
function removeNode<T>(history: History<T>, id: number, removeWholeGap = false) {
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
