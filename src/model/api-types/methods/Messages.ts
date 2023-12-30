import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesLongpollParams } from 'model/api-types/objects/MessagesLongpollParams'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import { UsersUser } from 'model/api-types/objects/UsersUser'

// messages.getConversations
export type MessagesGetConversationsParams = {
  count?: number
  fields: string
  extended: 1
  offset?: number
  filter?: 'all' | 'archive' | 'important' | 'unanswered' | 'unread'
  start_message_id?: number
  group_id?: number
}

export type MessagesGetConversationsResponse = {
  count: number
  unread_count?: number
  items: Array<{
    conversation: MessagesConversation
    last_message: MessagesMessage
  }>
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
}

// messages.getLongPollServer
export type MessagesGetLongPollServerParams = {
  lp_version: number
  need_pts: 1
  group_id?: number
}

export type MessagesGetLongPollServerResponse = MessagesLongpollParams
