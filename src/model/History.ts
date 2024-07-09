import * as Message from 'model/Message'
import { ExcludeFromArray } from 'misc/utils'

export type History = Array<Message.Message | Gap>

type Gap = {
  kind: 'Gap'
  fromCmid: Message.Cmid
  toCmid: Message.Cmid
}

export function lastMessage(history: History): Message.Message | undefined {
  const last = history.at(-1)

  if (last && last.kind !== 'Gap') {
    return last
  }

  return undefined
}

/**
 * Возвращает часть истории, непрерывно доступной вокруг aroundCmid,
 * то есть список сообщений до первого гэпа с обеих сторон от aroundCmid
 */
export function around(history: History, aroundCmid: Message.Cmid): {
  messages: Message.Message[]
  gapBefore?: Gap
  gapAround?: Gap
  gapAfter?: Gap
} {
  const aroundIndex = history.findIndex((node) => (
    node.kind === 'Gap'
      ? aroundCmid >= node.fromCmid && aroundCmid <= node.toCmid
      : aroundCmid === node.cmid
  ))
  const aroundNode = history[aroundIndex]

  if (!aroundNode) {
    return {
      messages: []
    }
  }

  if (aroundNode.kind === 'Gap') {
    return {
      messages: [],
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
    messages: history.slice(gapBeforeIndex + 1, gapAfterIndex) as ExcludeFromArray<History, Gap>,
    gapBefore,
    gapAfter
  }
}
