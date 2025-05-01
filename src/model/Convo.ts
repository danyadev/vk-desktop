import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { exhaustivenessCheck } from 'misc/utils'

export type Convo = UserConvo | GroupConvo | ChatConvo

interface BaseConvo {
  history: History.History<Message.Confirmed>
  pendingMessages: Message.Pending[]
  historyAroundCmid: Message.Cmid | 0
  unreadCount: number
  majorSortId: number
  minorSortId: number
  /** Cmid последнего прочитанного входящего сообщения (inbox) */
  inReadBy: Message.Cmid | 0
  /** Cmid последнего прочитанного исходящего сообщения (outbox) */
  outReadBy: Message.Cmid | 0
  notifications: {
    enabled: boolean
    disabledUntil: number
  }
}

interface UserConvo extends BaseConvo {
  kind: 'UserConvo'
  id: Peer.UserId
}

interface GroupConvo extends BaseConvo {
  kind: 'GroupConvo'
  id: Peer.GroupId
}

export interface ChatConvo extends BaseConvo {
  kind: 'ChatConvo'
  id: Peer.ChatId
  status: 'in' | 'kicked' | 'left' | 'out'
  isChannel: boolean
  isCasper: boolean
  pinnedMessage?: Message.Pinned
}

export type Style =
  | 'unknown'
  | 'default'
  | 'disco'
  | 'twilight'
  | 'sunset'
  | 'lagoon'
  | 'marine'
  | 'retrowave'
  | 'candy'
  | 'crimson'
  | 'emerald'
  | 'halloween_orange'
  | 'halloween_violet'
  | 'unicorn'
  | 'midnight'
  | 'easter_egg'
  | 'frost'
  | 'new_year'
  | 'valentine'
  | 'warm_valentine'
  | 'womens_day'
  | 'mable'
  | 'vk17'
  | 'gamer'
  | 'gifts'
  | 'sberkot'

export function get(id: Peer.UserId): UserConvo | undefined
export function get(id: Peer.GroupId): GroupConvo | undefined
export function get(id: Peer.ChatId): ChatConvo | undefined
export function get(id: Peer.Id): Convo | undefined
export function get(id: Peer.Id): Convo | undefined {
  const { convos } = useConvosStore()
  return convos.get(id)
}

export function safeGet(id: Peer.UserId): UserConvo
export function safeGet(id: Peer.GroupId): GroupConvo
export function safeGet(id: Peer.ChatId): ChatConvo
export function safeGet(id: Peer.Id): Convo
export function safeGet(id: Peer.Id): Convo {
  const convo = get(id)

  if (convo) {
    return convo
  }

  if (import.meta.env.DEV) {
    console.warn('Convo.safeGet: expected convo for ' + id)
  }

  return mock(id)
}

function mock(id: Peer.UserId): UserConvo
function mock(id: Peer.GroupId): GroupConvo
function mock(id: Peer.ChatId): ChatConvo
function mock(id: Peer.Id): Convo
function mock(id: Peer.Id): Convo {
  const base: BaseConvo = {
    history: [],
    pendingMessages: [],
    historyAroundCmid: 0,
    unreadCount: 0,
    majorSortId: 0,
    minorSortId: 0,
    inReadBy: 0,
    outReadBy: 0,
    notifications: {
      enabled: true,
      disabledUntil: 0
    }
  }

  if (Peer.isUserPeerId(id)) {
    return {
      kind: 'UserConvo',
      id,
      ...base
    }
  }

  if (Peer.isGroupPeerId(id)) {
    return {
      kind: 'GroupConvo',
      id,
      ...base
    }
  }

  if (Peer.isChatPeerId(id)) {
    return {
      kind: 'ChatConvo',
      id,
      status: 'in',
      isCasper: false,
      isChannel: false,
      ...base
    }
  }

  exhaustivenessCheck(id)
}

export function sorter(a: Convo, b: Convo) {
  if (a.majorSortId !== b.majorSortId) {
    return b.majorSortId - a.majorSortId
  }

  return b.minorSortId - a.minorSortId
}

export function lastMessage(convo: Convo, allowPending?: false): Message.Confirmed | undefined
export function lastMessage(convo: Convo, allowPending: true): Message.Message | undefined
export function lastMessage(convo: Convo, allowPending?: boolean): Message.Message | undefined {
  if (allowPending && convo.pendingMessages.length) {
    return convo.pendingMessages.at(-1)
  }

  return History.lastItem(convo.history)
}

export function insertMessages(
  convo: Convo,
  messages: Message.Confirmed[],
  hasMore: { up: boolean, down: boolean, aroundId: number }
) {
  History.insert(
    convo.history,
    messages.map((message) => History.toItem(message.cmid, message)),
    hasMore
  )
}

export function removeMessage(convo: Convo, cmid: Message.Cmid) {
  History.removeNode(convo.history, cmid)
}

export function removePendingMessage(convo: Convo, randomId: number) {
  if (randomId === 0) {
    return
  }

  const index = convo.pendingMessages.findIndex(
    (pending) => pending.randomId === randomId
  )
  if (index !== -1) {
    convo.pendingMessages.splice(index, 1)
  }
}

export function findMessage(convo: Convo, cmid: Message.Cmid): Message.Confirmed | undefined {
  const node = History.findNode(convo.history, cmid)

  if (node && node.kind !== 'Gap') {
    return node.item
  }
}

export function isCasper(convo: Convo): boolean {
  return convo.kind === 'ChatConvo' && convo.isCasper
}

export function isChannel(convo: Convo): boolean {
  return convo.kind === 'ChatConvo' && convo.isChannel
}
