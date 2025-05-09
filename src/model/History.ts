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
export function around<T>(history: History<T>, aroundId: number, strictlyIncludeId?: boolean): {
  items: Array<Item<T>>
  matchedAroundId: number
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
        matchedAroundId: aroundId
      }
    }

    // Если элемент находится после истории, вернем слайс в конце истории
    const lastNodeEndBoundary = lastNode.kind === 'Gap' ? lastNode.toId : lastNode.id
    if (aroundId > lastNodeEndBoundary) {
      return around(history, lastNodeEndBoundary)
    }

    // Иначе, элемент находится где-то в пустой зоне истории, находим первый элемент рядом с ним
    for (let i = 0; i < history.length; i++) {
      const node = history[i]
      const prevNode = history[i - 1]
      if (!node) {
        continue
      }

      const nodeStartBoundary = node.kind === 'Gap' ? node.fromId : node.id
      if (nodeStartBoundary > aroundId) {
        // Предпочитаем отображать более актуальную историю
        // aroundId: 5; [4-, 6+] -> around 6+
        if (node.kind !== 'Gap') {
          return around(history, nodeStartBoundary)
        }
        // Но если рядом оказалась только прошлая история, возвращаем ее
        // aroundId: 5; [4-, [6+, n]] -> around 4-
        if (prevNode && prevNode.kind !== 'Gap') {
          return around(history, prevNode.id)
        }
        // Иначе отдаем гэп более актуальной истории
        // aroundId: 5; [[n, 4-]?, [6+, n]] -> gap [6+, n]
        return {
          items: [],
          gapAround: node,
          matchedAroundId: nodeStartBoundary
        }
      }
    }

    // По сути невозможный кейс, возвращаем пустоту
    return {
      items: [],
      matchedAroundId: aroundId
    }
  }

  if (aroundNode.kind === 'Gap') {
    if (!strictlyIncludeId) {
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
      matchedAroundId: aroundId
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
    matchedAroundId: aroundId,
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

    if (startIndex !== -1) {
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
