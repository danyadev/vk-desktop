import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { useEnv } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'

type Props = {
  peerId: Peer.Id
  startCmid: Message.Cmid
  gap: History.Gap
  direction: 'around' | 'up' | 'down'
  onHistoryInserted: (messages: Message.Confirmed[]) => void
}

export async function loadConvoHistory({
  peerId,
  startCmid,
  gap,
  direction,
  onHistoryInserted
}: Props) {
  const { api } = useEnv()
  const { loadConvoHistoryLock } = useConvosStore()

  const loadingKey = `${peerId}-${direction}` as const

  if (loadConvoHistoryLock.get(loadingKey) === 'loading') {
    return
  }

  loadConvoHistoryLock.set(loadingKey, 'loading')

  let count = 20
  let offset = 0
  let reachedUpperBoundary = false
  let reachedLowerBoundary = false

  switch (direction) {
    case 'around': {
      /**
       * Грузим историю вокруг startCmid.
       * По возможности полностью загружаем историю до конца гэпа
       *
       * Представим ситуацию:
       * { kind: 'Gap', fromId: 1, toId: 100 }
       * startCmid: 90
       * До закрытия гэпа достаточно загрузить 100 - 90 + 1 = 11 сообщений
       */
      const messagesToGapEnd = gap.toId - startCmid + 1
      if (messagesToGapEnd <= count) {
        offset = -messagesToGapEnd + 1
        reachedLowerBoundary = true
        break
      }
      // Грузим 70% сообщений новее и 30% сообщений старше
      offset = -Math.floor(count * 0.7)
      break
    }

    case 'up': {
      /**
       * Загружаем историю, начиная со startCmid и старше
       *
       * Представим ситуацию:
       * { kind: 'Gap', fromId: 30, toId: 40 }
       * { kind: 'Item', cmid: 41 }
       * startCmid = 40
       * Нам до закрытия гэпа достаточно загрузить 40 - 30 + 1 = 11 сообщений
       */
      const messagesToGapStart = startCmid - gap.fromId + 1
      if (messagesToGapStart <= count) {
        count = messagesToGapStart
        reachedUpperBoundary = true
      }
      break
    }

    case 'down': {
      /**
       * Загружаем сообщения новее startCmid
       *
       * Представим ситуацию:
       * { kind: 'Item', cmid: 99 }
       * { kind: 'Gap', fromId: 100, toId: 110 }
       * { kind: 'Item', cmid: 111 }
       * startCmid = 100
       * Нам до закрытия гэпа достаточно загрузить 110 - 100 + 1 сообщений
       */
      const messagesToGapEnd = gap.toId - startCmid + 1
      if (messagesToGapEnd <= count) {
        count = messagesToGapEnd
        reachedLowerBoundary = true
      }
      // Грузим в направлении новых сообщений, но включаем и сам startCmid
      offset = -count + 1
      break
    }
  }

  try {
    const convo = Convo.safeGet(peerId)

    const {
      items,
      profiles,
      groups
    } = await api.fetch('messages.getHistory', {
      peer_id: peerId,
      start_cmid: startCmid,
      count,
      offset,
      extended: 1,
      fwd_extended: 1,
      fields: PEER_FIELDS
    })

    insertPeers({
      profiles,
      groups
    })

    // Апи возвращает сообщения от новых к старым, а мы храним историю со старых до новых
    const messages = items.map(fromApiMessage).reverse()
    let hasMoreUp = false
    let hasMoreDown = false

    if (direction === 'up') {
      hasMoreUp = !reachedUpperBoundary && items.length === count
    }
    if (direction === 'down') {
      hasMoreDown = !reachedLowerBoundary && items.length === count
    }
    if (direction === 'around') {
      const upperMessagesCount = items.filter((item) => (
        item.conversation_message_id <= startCmid
      )).length
      const lowerMessagesCount = items.length - upperMessagesCount
      /**
       * Если offset = 0, то мы грузим count сообщений вверх начиная со startCmid.
       * Если offset < 0, то мы грузим count сообщений вверх начиная со startCmid + |offset|,
       * то есть достаем сообщения в том числе под startCmid.
       * Если offset = -count, то мы грузим сообщения ровно после startCmid, не включая его.
       *
       * requestedUpperMessages = count - |offset|:
       * offset = 0 -> сообщениями выше будет весь count
       * offset < 0 -> сообщениями выше будет count + offset
       * requestedLowerMessages = |offset|, так как это равно count - requestedUpperMessages
       */
      const requestedUpperMessages = count + offset
      const requestedLowerMessages = -offset

      hasMoreUp = !reachedUpperBoundary && requestedUpperMessages === upperMessagesCount
      hasMoreDown = !reachedLowerBoundary && requestedLowerMessages === lowerMessagesCount
    }

    Convo.insertMessages(convo, messages, {
      up: hasMoreUp,
      down: hasMoreDown,
      aroundId: startCmid
    })
    onHistoryInserted(messages)

    loadConvoHistoryLock.delete(loadingKey)
  } catch (err) {
    console.warn('[loadConvoHistory] loading error', err)
    loadConvoHistoryLock.set(loadingKey, 'error')
  }
}
