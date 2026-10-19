import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { exhaustivenessCheck } from 'misc/utils'

export type Convo = UserConvo | GroupConvo | ChatConvo

export interface BaseConvo {
  history: History.History<Message.Confirmed>
  pendingMessages: Message.Pending[]
  canWrite: { allowed: boolean, reason: number | undefined }
  unreadCount: number
  /**
   * Id для сортировки с высоким приоритетом.
   * Используется вместо minorSortId, если значения между двумя конвами не совпадают.
   *
   * Нужен, чтобы поднять закрепленные конвы над всеми остальными
   */
  majorSortId: number
  /**
   * Id для сортировки с обычным приоритетом.
   * Используется, когда majorSortId между конвами идентичны.

   * Обычно равен cmid последнего сообщения, но не всегда:
   * - иногда чат может намеренно не подняться, тогда id будет меньше последнего cmid,
   *   например когда пришло сервисное сообщение о выходе кого-то из чата без активности;
   * - иногда чат может намеренно не опуститься, тогда id будет больше последнего cmid,
   *   например когда удалилась вся история чата (возможно сейчас уже не так, но раньше бывало)
   */
  minorSortId: number
  /** Cmid последнего прочитанного входящего сообщения. Исходящие засчитываются автоматически */
  inReadBy: Message.Cmid | 0
  /** Cmid последнего прочитанного исходящего сообщения. Входящие засчитываются автоматически */
  outReadBy: Message.Cmid | 0
  notifications: {
    enabled: boolean
    disabledUntil: number
  }
  folderIds: number[]
  isArchived: boolean
  isMarkedUnread: boolean
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
  ownerId: Peer.OwnerId | undefined
  adminIds: Set<Peer.OwnerId>
  permissions: {
    canChangePin: boolean
    canModerate: boolean
    canForwardMessages: boolean
  }
  pinnedMessage: Message.Pinned | undefined
  mentionedCmids: Set<Message.Cmid>
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

export const flags = {
  markedUnread: 1 << 20,
  archived: 1 << 23
}

export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.UserId): UserConvo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.GroupId): GroupConvo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.ChatId): ChatConvo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.Id): Convo
export function safeGet(convos: Map<Peer.Id, Convo>, id: Peer.Id): Convo {
  const convo = convos.get(id)

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
    canWrite: { allowed: false, reason: undefined },
    unreadCount: 0,
    majorSortId: 0,
    minorSortId: 0,
    inReadBy: 0,
    outReadBy: 0,
    notifications: {
      enabled: true,
      disabledUntil: 0
    },
    folderIds: [],
    isArchived: false,
    isMarkedUnread: false
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
      ownerId: undefined,
      adminIds: new Set(),
      permissions: { canChangePin: false, canModerate: false, canForwardMessages: false },
      pinnedMessage: undefined,
      mentionedCmids: new Set(),
      ...base
    }
  }

  exhaustivenessCheck(id)
}

// TODO: поддержать pending сообщения
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

export function lastEditableMessage(
  convo: Convo,
  viewerId: Peer.OwnerId
): Message.Normal | undefined {
  for (let i = convo.history.length - 1; i >= 0; i--) {
    const node = convo.history[i]

    if (
      node?.kind === 'Item' &&
      node.item.kind === 'Normal' &&
      canEditMessage(convo, node.item, viewerId)
    ) {
      return node.item
    }
  }
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

/**
 * Восстанавливает удаленное сообщение.
 * Добавляет сообщение в историю только если оно находится посреди или рядом с доступной историей
 */
export function restoreMessage(convo: Convo, message: Message.Confirmed) {
  if (canInsertRestoredMessage(convo, message.cmid)) {
    insertMessages(convo, [message], {
      up: true,
      down: true,
      aroundId: message.cmid
    })
  }
}

/**
 * Проверяет, что сообщение может быть добавлено к доступной локально истории,
 * а не оторвано от нее и находится посреди гэпа
 */
export function canInsertRestoredMessage(convo: Convo, cmid: Message.Cmid) {
  const node = History.findNode(convo.history, cmid)

  return (
    // Если сообщение восстанавливается посреди доступной истории, оно просто не найдется
    !node ||
    // Если сообщение нашлось, то тоже обновим его, могло прийти более актуальное сообщение
    node.kind === 'Item' ||
    // Если это начало гэпа, то дополним слайс истории выше, но убедимся, что это не верх истории
    (node.fromId === cmid && convo.history[0] !== node) ||
    // Если это конец гэпа, то дополним слайс истории ниже, либо выставим последнее сообщение
    node.toId === cmid
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

export function isUnread(convo: Convo): boolean {
  return convo.unreadCount > 0 || convo.isMarkedUnread
}

export function canPinMessage(convo: Convo): boolean {
  return (
    convo.kind === 'ChatConvo' &&
    convo.status === 'in' &&
    !convo.isCasper &&
    convo.permissions.canChangePin
  )
}

export function canEditMessage(
  convo: Convo,
  message: Message.Normal,
  viewerId: Peer.OwnerId
): boolean {
  const isFavorites = convo.id === viewerId
  const isPinned = convo.kind === 'ChatConvo' && convo.pinnedMessage?.cmid === message.cmid
  const canEditByTimeLimit = Date.now() - message.sentAt < 24 * 60 * 60 * 1000

  return (
    convo.canWrite.allowed &&
    (convo.kind !== 'ChatConvo' || convo.status === 'in') &&
    message.isOut &&
    (canEditByTimeLimit || isFavorites || isPinned) &&
    !message.attaches.sticker &&
    !message.attaches.voice
  )
}

export function canDeleteMessageForAll(
  convo: Convo,
  message: Message.Confirmed,
  viewerId: Peer.OwnerId
): boolean {
  if (convo.id === viewerId) return false
  if (!convo.canWrite.allowed) return false
  if (convo.kind === 'ChatConvo' && convo.status !== 'in') return false
  if (message.kind === 'Service') return false
  if (message.authorId === viewerId) return true

  if (convo.kind === 'ChatConvo') {
    const isViewerAdmin = convo.ownerId === viewerId || convo.adminIds.has(viewerId)
    const isAuthorAdmin =
      convo.ownerId === message.authorId || convo.adminIds.has(message.authorId)
    if (isViewerAdmin && !isAuthorAdmin) return true
  }

  return false
}

export function isCasper(convo: Convo): boolean {
  return convo.kind === 'ChatConvo' && convo.isCasper
}

export function isChannel(convo: Convo): boolean {
  return convo.kind === 'ChatConvo' && convo.isChannel
}

/**
 * Проверяет, что беседа не показывается в списке бесед.
 * Пустая беседа не гарантирует что беседы нет в списке. Например, каспер чаты при "исчезании"
 * не пропадают со своей позиции в списке.
 * Не-пустая беседа так же не гарантирует что беседа есть в списке. Например, приветственные
 * сообщения сообществ не поднимают беседу в списке
 */
export function isHidden(convo: Convo): boolean {
  return convo.minorSortId === 0 && convo.pendingMessages.length === 0
}
