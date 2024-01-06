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

export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.UserId): UserConvo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.GroupId): GroupConvo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.ChatId): ChatConvo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.Id): Convo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.Id): unknown {
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
