import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'

export type Convo = UserConvo | GroupConvo | ChatConvo

interface BaseConvo {
  history: History.History<Message.Message>
  unreadCount: number
  enabledNotifications: boolean
  majorSortId: number
  minorSortId: number
  inReadBy: Message.Cmid
  outReadBy: Message.Cmid
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

export function safeGet(id: Peer.UserId): UserConvo
export function safeGet(id: Peer.GroupId): GroupConvo
export function safeGet(id: Peer.ChatId): ChatConvo
export function safeGet(id: Peer.Id): Convo
export function safeGet(id: Peer.Id): unknown {
  const { convos } = useConvosStore()
  const convo = convos.get(id)

  if (!convo) {
    throw new Error('Convo.safeGet: expected convo for ' + id)
  }

  return convo
}

export function sorter(a: Convo, b: Convo) {
  if (a.majorSortId !== b.majorSortId) {
    return b.majorSortId - a.majorSortId
  }

  return b.minorSortId - a.minorSortId
}

export function insertMessages(
  convo: Convo,
  messages: Message.Message[],
  hasMore: { up: boolean, down: boolean, aroundId: number }
) {
  History.insert(
    convo.history,
    messages.map((message) => History.toItem(message.cmid, message)),
    hasMore
  )
}

export function isCasper(convo: Convo): boolean {
  return convo.kind === 'ChatConvo' && convo.isCasper
}
