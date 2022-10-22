import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
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
