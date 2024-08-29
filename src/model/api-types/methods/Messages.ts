import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
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
  need_pts: 1
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
