import { exhaustivenessCheck, Opaque } from 'misc/utils'

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
type GroupId = Opaque<number, Group>
type ChatId = Opaque<number, Chat>

type Peer = User | Group | Chat
type Id = Peer['id']

type User = {
  kind: 'User'
  id: UserId
}

type Group = {
  kind: 'Group'
  id: GroupId
}

type Chat = {
  kind: 'Chat'
  id: ChatId
}

/**
 * Конвертит число в Peer.Id
 */
function resolveId(id: number): Id {
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

// временно неиспользуемые функции
/* eslint-disable */
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
    default:
      exhaustivenessCheck(kind)
  }
}

function toRealId(peerId: Id): number {
  if (isUserPeerId(peerId)) {
    return peerId
  }
  if (isGroupPeerId(peerId)) {
    return -peerId
  }
  if (isChatPeerId(peerId)) {
    return peerId - 2e9
  }

  exhaustivenessCheck(peerId)
}
/* eslint-enable */

function isUserPeerId(peerId: Id): peerId is UserId {
  return peerId > 0 && peerId < 1.9e9
}

function isGroupPeerId(peerId: Id): peerId is GroupId {
  return peerId < 0 && peerId > -1.9e9 + 1e7
}

function isChatPeerId(peerId: Id): peerId is ChatId {
  return peerId > 2e9
}
