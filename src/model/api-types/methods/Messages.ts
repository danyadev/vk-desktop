import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesLongpollParams } from 'model/api-types/objects/MessagesLongpollParams'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'

// messages.getConversations
export type MessagesGetConversationsParams = {
  count?: number
}

export type MessagesGetConversationsResponse = {
  count: number
  items: Array<{
    conversation: MessagesConversation
    last_message: MessagesMessage
  }>
}

// messages.getLongPollServer
export type MessagesGetLongPollServerParams = {
  lp_version: number
  need_pts: 1
  group_id?: number
}

export type MessagesGetLongPollServerResponse = MessagesLongpollParams
