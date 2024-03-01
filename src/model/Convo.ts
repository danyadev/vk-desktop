import { useConvosStore } from 'store/convos'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'

export type Convo = UserConvo | GroupConvo | ChatConvo

interface BaseConvo {
  history: History
  unreadCount: number
  enabledNotifications: boolean
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
}

export type History = Array<Message.Message | HistoryGap>

type HistoryGap = {
  kind: 'Gap'
  fromCmid: Message.Cmid
  toCmid: Message.Cmid
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

export function lastMessage(convo: Convo): Message.Message | undefined {
  const last = convo.history.at(-1)

  if (last && last.kind !== 'Gap') {
    return last
  }

  return undefined
}

export function isCasper(convo: Convo): boolean {
  return convo.kind === 'ChatConvo' && convo.isCasper
}
