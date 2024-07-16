import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
import { MessagesLongpollParams } from 'model/api-types/objects/MessagesLongpollParams'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import { UsersUser } from 'model/api-types/objects/UsersUser'

// messages.getConversations
export type MessagesGetConversationsParams = {
  count?: number
  fields: string
  extended: 1
  offset?: number
  filter?: 'all' | 'archive' | 'business_notify' | 'chats' | 'important' | 'message_request' | 'unanswered' | 'unread'
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

export type MessagesGetLongPollServerResponse = MessagesLongpollParams
