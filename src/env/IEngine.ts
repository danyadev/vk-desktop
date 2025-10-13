import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'
import { MessagesMessageAction } from 'model/api-types/objects/MessagesMessage'
import { MessagesMessageAttachmentType } from 'model/api-types/objects/MessagesMessageAttachment'

export const VERSION = 21

export type Response =
  | { ts: number, pts: number, updates: Update[] }
  // ts слишком маленький (отстал на 256+ событий) или слишком большой
  | { failed: 1, ts: number }
  // Протух key, нужно получить новый через messages.getLongPollServer
  | { failed: 2, error: string }
  // Указана неверная версия движка
  | { failed: 4, min_version: number, max_version: number }

export type Update =
  | Update10002
  | Update10003
  | Update10004
  | Update10005
  | Update10006
  | Update10007
  | Update10
  | Update12
  | Update10018
  | Update63
  | Update64
  | Update65
  | Update66
  | Update67
  | Update68
  | Update114

// Изменение флагов сообщения
type Update10002 = [
  type: 10002,
  cmid: number,
  flags: number,
  peerId: number
]

// Сброс флагов сообщения
type Update10003 = [
  type: 10003,
  cmid: number,
  flags: number,
  // По неведомой причине айди беседы может не прийти при восстановлении старых сообщений
  peerId?: number
] | Update10003Restore

// Сброс флагов удаления сообщения
export type Update10003Restore = [
  type: 10003,
  cmid: Update10004[1],
  flags: Update10004[2],
  peerId: Update10004[4],
  timestamp: Update10004[5],
  text: Update10004[6],
  additional: Update10004[7],
  attachments: Update10004[8],
  randomId: Update10004[9],
  messageId: Update10004[10],
  updateTimestampInSeconds: number
]

// Новое сообщение
export type Update10004 = [
  type: 10004,
  cmid: number,
  flags: number,
  minorId: number,
  peerId: number,
  timestamp: number,
  text: string,
  additional: {
    from?: number
    marked_users?: Array<
      // Список упомянутых пиров, включая ответ на сообщение
      | [1, number[]]
      // @online и список пиров, которые были онлайн в момент меншена
      | [1, 'online', number[]]
      // @all
      | [1, 'all']
      // Исчезающее сообщение в обычном чате
      | [2, 'all']
    >
    source_act?: MessagesMessageAction['type']
    source_mid?: string
    source_text?: string
    source_old_text?: string
    source_style?: string
    source_chat_local_id?: string
    source_message?: string
    pinned_at?: string
    expire_ttl?: string
    ttl?: string
    is_expired?: '1'
    is_silent?: '1'
    is_translated?: '1'
    keyboard?: MessagesKeyboard
    has_template?: '1'
    payload?: string
  },
  attachments: {
    attachments?: string
    attach1_kind?: string
    attach1_type?: MessagesMessageAttachmentType
    attach1?: string
    attach2_type?: MessagesMessageAttachmentType
    attach2?: string
    // JSON-строка с объектом ReplyMessageId
    reply?: string
    // Обозначает наличие пересланных или ответа на сообщение
    fwd?: '0_0'
    geo?: string
  },
  randomId: number,
  messageId: number,
  updateTimestamp: 0
]

export type ReplyMessageId = {
  conversation_message_id: number
}

// Редактирование сообщения
export type Update10005 = [
  type: 10005,
  cmid: Update10004[1],
  flags: Update10004[2],
  peerId: Update10004[4],
  timestamp: Update10004[5],
  text: Update10004[6],
  additional: Update10004[7],
  attachments: Update10004[8],
  randomId: Update10004[9],
  messageId: Update10004[10],
  updateTimestampInSeconds: number
]

// Прочтение входящих сообщений
type Update10006 = [
  type: 10006,
  peerId: number,
  lastCmid: number,
  inUnreadCount: number
]

// Прочтение исходящих сообщений
type Update10007 = [
  type: 10007,
  peerId: number,
  lastCmid: number,
  outUnreadCount: number
]

// Удаление указанных флагов беседы
type Update10 = [
  type: 10,
  peerId: number,
  flags: number
]

// Добавление указанных флагов беседы
type Update12 = [
  type: 12,
  peerId: number,
  flags: number
]

// Обновление сообщения
export type Update10018 = [
  type: 10018,
  cmid: Update10004[1],
  flags: Update10004[2],
  peerId: Update10004[4],
  timestamp: Update10004[5],
  text: Update10004[6],
  additional: Update10004[7],
  attachments: Update10004[8],
  randomId: Update10004[9],
  messageId: Update10004[10],
  updateTimestampInSeconds: number
]

// Тайпинг ввода текста
type Update63 = [
  type: 63,
  peerId: number,
  typingPeerIds: number[],
  totalCount: number,
  timestamp: number
]

// Тайпинг записи голосового
type Update64 = [
  type: 64,
  peerId: number,
  typingPeerIds: number[],
  totalCount: number,
  timestamp: number
]

// Тайпинг загрузки фото
type Update65 = [
  type: 65,
  peerId: number,
  typingPeerIds: number[],
  totalCount: number,
  timestamp: number
]

// Тайпинг загрузки видео
type Update66 = [
  type: 66,
  peerId: number,
  typingPeerIds: number[],
  totalCount: number,
  timestamp: number
]

// Тайпинг загрузки файла
type Update67 = [
  type: 67,
  peerId: number,
  typingPeerIds: number[],
  totalCount: number,
  timestamp: number
]

// Тайпинг записи видеосообщения
type Update68 = [
  type: 68,
  peerId: number,
  typingPeerIds: number[],
  totalCount: number,
  timestamp: number
]

// Изменение настроек пуш-уведомлений в беседе
type Update114 = [
  type: 114,
  data: {
    peer_id: number
    sound: 0 | 1
    disabled_until: number
  }
]
