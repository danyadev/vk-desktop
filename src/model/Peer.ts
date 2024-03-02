import { usePeersStore } from 'store/peers'
import { exhaustivenessCheck, getFirstLetter, Opaque } from 'misc/utils'

/**
 * Peer (пир или диалог) - термин, объединяющий все сущности мессенджера:
 * личка с пользователем, личка с группой, чат и так далее
 *
 * Chat (чат или беседа) - диалог с несколькими пользователями
 *
 * PeerId - id диалога на числовой прямой, которая размечена на сущности (User, Group, Chat, ...).
 * По этому id можно определить тип сущности (см. isUserPeerId, isGroupPeerId, ...)
 *
 * UserId, GroupId, ChatId, ... - разновидность PeerId (соответственно 1, -1, 2e9 + 1, ...)
 *
 * Реальный id - у каждой сущности есть "чистый" id, не относящийся к числовой прямой,
 * то есть являющимся числом, начинающимся от 1 (см. toRealId)
 */

export type UserId = Opaque<number, User>
export type GroupId = Opaque<number, Group>
export type ChatId = Opaque<number, Chat>

export type Peer = User | Group | Chat
export type Id = UserId | GroupId | ChatId

export type User = {
  kind: 'User'
  id: UserId
  firstName: string
  firstNameAcc: string
  lastName: string
  lastNameAcc: string
  photo50?: string
  photo100?: string
  gender: 'male' | 'female' | 'unknown'
}

export type Group = {
  kind: 'Group'
  id: GroupId
  name: string
  screenName: string
  photo50?: string
  photo100?: string
}

export type Chat = {
  kind: 'Chat'
  id: ChatId
  title: string
  photo50?: string
  photo100?: string
}

/**
 * Конвертит число в Peer.Id
 */
export function resolveId(id: number): Id {
  if (id === 0) {
    throw new Error('Peer.Id = 0')
  }

  return id as Id
}

/**
 * Необходимо для значений по умолчанию, которые перед использованием
 * точно будут перезаписаны, но при этом вариант с nullable типом недопустим
 */
export function resolveZeroUserId(): UserId {
  return 0 as UserId
}

/**
 * Конвертит realId в указанную сущность, входящую в PeerId
 */
export function resolveRealId(realId: number, kind: 'User'): UserId
export function resolveRealId(realId: number, kind: 'Group'): GroupId
export function resolveRealId(realId: number, kind: 'Chat'): ChatId
export function resolveRealId(realId: number, kind: Peer['kind']): Id {
  switch (kind) {
    case 'User':
      return resolveId(realId)
    case 'Group':
      return resolveId(-realId)
    case 'Chat':
      return resolveId(realId + 2e9)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toRealId(peerId: Id): number {
  if (isUserPeerId(peerId)) {
    return peerId
  }
  if (isGroupPeerId(peerId)) {
    return -Number(peerId)
  }
  if (isChatPeerId(peerId)) {
    return peerId - 2e9
  }

  exhaustivenessCheck(peerId)
}

export function isUserPeerId(peerId: Id): peerId is UserId {
  return peerId > 0 && peerId < 1.9e9
}

export function isGroupPeerId(peerId: Id): peerId is GroupId {
  return peerId < 0 && peerId > -1.9e9 + 1e7
}

export function isChatPeerId(peerId: Id): peerId is ChatId {
  return peerId > 2e9
}

export function safeGet(id: UserId): User
export function safeGet(id: GroupId): Group
export function safeGet(id: ChatId): Chat
export function safeGet(id: Id): Peer
export function safeGet(id: Id): unknown {
  const { peers } = usePeersStore()
  const peer = peers.get(id)

  if (!peer) {
    throw new Error('Peer.safeGet: expected peer for ' + id)
  }

  return peer
}

export function name(peer: Peer, nameCase?: 'acc'): string {
  switch (peer.kind) {
    case 'User':
      return nameCase === 'acc'
        ? `${peer.firstNameAcc} ${peer.lastNameAcc}`
        : `${peer.firstName} ${peer.lastName}`
    case 'Group':
      return peer.name
    case 'Chat':
      return peer.title
  }
}

export function firstName(peer: Peer): string {
  switch (peer.kind) {
    case 'User':
      return peer.firstName
    case 'Group':
      return peer.name
    case 'Chat':
      return peer.title
  }
}

export function initials(peer: Peer): string {
  switch (peer.kind) {
    case 'User':
      return getFirstLetter(peer.firstName) + getFirstLetter(peer.lastName)
    case 'Group':
      return getFirstLetter(peer.name).toUpperCase()
    case 'Chat':
      return getFirstLetter(peer.title).toUpperCase()
  }
}
