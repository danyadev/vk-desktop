import { MessagesConversation } from 'services/contracts/api/objects/MessagesConversation'
import { MessagesMessage } from 'services/contracts/api/objects/MessagesMessage'

export type MessagesGetDiffConversationInfo = {
  conversation?: MessagesConversation
  /** Массив с одним элементом - последним сообщением */
  message?: MessagesMessage[]
  /** Массив рейнджей удаленных сообщений. Отсортирован */
  range_deleted_cmids?: Array<{ min: number, max: number }>
  /** Массив рейнджей измененных сообщений. Отсортирован */
  range_updated_cmids?: Array<{ min: number, max: number }>
  /** Массив измененных сообщений. Может пересекаться с рейнджами. Отсортирован */
  cmids_flags?: Array<{
    cmid: number
    updated_flags: number
  }>
  /** Массив сообщений с изменениями в реакциях. Не отсортирован */
  cmids_updated_reactions?: number[]
  /** Изменились ли участники чата */
  members_changed?: boolean
  /** Нужно ли инвалидировать историю чата */
  invalidate?: boolean
}
