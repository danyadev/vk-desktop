import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
import { MessagesCounters } from 'model/api-types/objects/MessagesCounters'
import { MessagesFolder } from 'model/api-types/objects/MessagesFolder'
import { MessagesGetDiffContentItem } from 'model/api-types/objects/MessagesGetDiffContentItem'
import { MessagesGetDiffConversationInfo } from 'model/api-types/objects/MessagesGetDiffConversationInfo'
import { MessagesLongpollCredentials } from 'model/api-types/objects/MessagesLongpollCredentials'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import { UsersUser } from 'model/api-types/objects/UsersUser'

// messages.getConversations
export type MessagesGetConversationsParams = {
  count?: number
  fields: string
  extended: 1
  offset?: number
  filter?: 'all' | 'archive' | 'business_notify' | 'chats' | 'important' | 'message_request' | 'sorted_chats' | 'unanswered' | 'unread'
  folder_id?: number
  start_from_minor_sort_id?: number
  group_id?: number
}

export type MessagesGetConversationsResponse = {
  count: number
  unread_count?: number
  items: MessagesConversationWithMessage[]
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  // contacts?: MessagesContact[]
}

// messages.getConversationsById
export type MessagesGetConversationsByIdParams = {
  peer_ids: string | number
  with_last_messages?: 0 | 1
  extended: 1
  fields: string
}

export type MessagesGetConversationsByIdResponse = {
  count: number
  items: MessagesConversation[]
  last_messages?: MessagesMessage[]
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
}

// messages.getHistory
export type MessagesGetHistoryParams = {
  peer_id: number
  start_cmid?: number
  count?: number
  offset?: number
  filter?: 'all' | 'audio' | 'file' | 'link' | 'media_viewer' | 'photo' | 'pinned_messages' | 'video'
  extended: 1
  fwd_extended: 1
  fields: string
  group_id?: number
}

export type MessagesGetHistoryResponse = {
  count: number
  items: MessagesMessage[]
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  conversations?: MessagesConversation[]
  // contacts?: MessagesContact[]
  // apps?: AppsApp[]
}

// messages.getLongPollServer
export type MessagesGetLongPollServerParams = {
  lp_version: number
  need_pts: 0 | 1
  group_id?: number
}

export type MessagesGetLongPollServerResponse = MessagesLongpollCredentials

// messages.getLongPollHistory
export type MessagesGetLongPollHistoryParams = {
  pts: number
  lp_version: number
  msgs_limit: number
  events_limit: number
  // - при указании last_n сдвигается вперед from_pts и теряются старые события
  // - а если не указывать, то применяются лимиты выше, и при выходе за них приходит more: 1
  last_n: number
  credentials?: 0 | 1
  extended: 1
  fields: string
}

export type MessagesGetLongPollHistoryResponse = {
  history: Array<Array<string | number>>
  from_pts: number
  new_pts: number
  conversations: MessagesConversation[]
  messages: {
    count: number
    items: MessagesMessage[]
  }
  more?: boolean
  credentials?: MessagesLongpollCredentials
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  // contacts?: MessagesContact[]
  // incognito_members?: MessagesExtendedIncognitoMember[]
}

// messages.send
export type MessagesSendParams = {
  peer_id: number
  random_id: number
  message: string
  attachment?: string
}

export type MessagesSendResponse = {
  cmid: number
  message_id: number
}

// messages.markAsPlayed
export type MessagesMarkAsPlayedParams = {
  peer_id: number
  cmid: number
  group_id?: number
}

export type MessagesMarkAsPlayedResponse = 1

// messages.getDiffContent
export type MessagesGetDiffContentParams = {
  // JSON строка с типом MessagesGetDiffContentInput
  conversation_messages: string
  extended: 1
  fields: string
  group_id?: number
}

export type MessagesGetDiffContentResponse = {
  items: MessagesGetDiffContentItem[]
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  // contacts?: MessagesContact[]
}

// messages.getDiff
export type MessagesGetDiffParams = {
  lp_version: number
  // pts последнего известного события
  from_version?: number
  // Ограничение максимального значения pts
  to_version?: number
  fields: string
  // profiles, contacts, groups, counters, folders, folders_with_peers, conversations_banner,
  // messages, server_version, credentials
  extended_filters: string
  // 'all' or any field name it returns when calling with 'all'
  counter_filters?: string
  // Поддерживаемые типы папок: business, channels, unread, personal, managed_groups
  supported_types?: string
  // Значение conversations_source из ответа предыдущего вызова messages.getDiff,
  // чтобы получить следующую пачку данных если предыдущего ответа не хватило
  conversations_source?: string
  // Максимальное количество бесед, загружаемое в рамках одного запроса
  conversations_limit?: number
  group_id?: number
}

export type MessagesGetDiffResponse = {
  conversations_info?: MessagesGetDiffConversationInfo[]
  folders?: {
    count: number
    items: MessagesFolder[]
  }
  counters?: MessagesCounters
  credentials?: {
    server_lp: string
    key: string
    ts: number
  }
  // conversations_banner?: MessagesConversationBar
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  // contacts?: MessagesContact[]
  server_version?: number
  conversations_source?: string
  invalidate_all?: boolean
}
