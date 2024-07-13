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
 */
export function insert<T>(
  history: History<T>,
  items: Array<Item<T>>,
  hasMore: { up: boolean, down: boolean }
) {
  const firstItem = items[0]
  const lastItem = items.at(-1)

  if (!firstItem || !lastItem) {
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
       * Чисто технически найденная нода может находиться позже последнего вставляемого элемента,
       * но это возможно только в случае, когда в истории не был размечен гэп в этой зоне,
       * что должно быть невозможным, так как это нарушает целостность структуры
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

  /**
   * Если стартовой ноды не нашлось, значит вставляемая история не налезает на
   * уже существующую историю, а добавляется после нее
   */
  if (!startNode) {
    if (hasMore.up) {
      const lastNode = history.at(-1)
      history.push({
        kind: 'Gap',
        fromId: lastNode
          ? (lastNode.kind === 'Gap' ? lastNode.toId : lastNode.id) + 1
          : 1,
        toId: lastItem.id - 1
      })
    }

    history.push(...items)

    if (hasMore.down) {
      history.push({
        kind: 'Gap',
        fromId: lastItem.id + 1,
        toId: Infinity
      })
    }

    return
  }

  if (startNode.kind === 'Gap') {
    // Вся вставляемая история помещается внутрь одного гэпа; hasMore можно проигнорировать
    if (startNode === endNode) {
      // Если гэп совпадает со вставляемой историей, удаляем гэп и вставляем элементы
      if (startNode.fromId === firstItem.id && startNode.toId === lastItem.id) {
        history.splice(startIndex, 1, ...items)
        return
      }

      // Разделяем один гэп на два: до истории и после.
      // Сначала вставляем разделенную нижнюю часть, если конец гэпа
      // не совпадает с последним элементом
      if (startNode.toId !== lastItem.id) {
        history.splice(startIndex + 1, 0, {
          kind: 'Gap',
          fromId: lastItem.id + 1,
          toId: startNode.toId
        })
      }

      // Если начало гэпа совпадает с первым элементом, удаляем гэп и вставляем элементы
      if (startNode.fromId === firstItem.id) {
        history.splice(startIndex, 1, ...items)
        return
      }

      // Иначе обрезаем верхний гэп и вставляем элементы
      startNode.toId = firstItem.id - 1
      history.splice(startIndex + 1, 0, ...items)
      return
    }

    // let deleteStartNode = false
    // if (startNode.fromId > firstItem.id) {
    //   // Мы полностью перекрываем начальный гэп и можем его удалить.
    //   // Сделаем позже, чтобы не сдвинуть индексы
    //   deleteStartNode = true
    // } else {
    //   // Наш контент начинается после начала гэпа, обрезаем его
    //   startNode.toId = firstItem.id - 1
    // }
    //
    // // Начальную ноду мы полностью
    // history.splice(startIndex, 0, ...items)
    //
    // history.splice()
  }

  // Если нет конечной ноды, а стартовая не-гэп, заменяем всю историю
  // начиная со стартовой ноды на нашу
  // if (!endNode) {
  //   history.splice(startIndex, history.length, ...items)
  //   return
  // }
  //
  // if (endNode.kind === 'Gap') {
  //   // Если конечная нода
  //   if (endNode.toId <= lastItem.id) {
  //     history.splice(startIndex, endIndex, ...items)
  //     return
  //   }
  // }

  throw 'not implemented yet'
}
