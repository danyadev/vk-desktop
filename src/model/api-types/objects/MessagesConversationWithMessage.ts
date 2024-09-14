import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'

export type MessagesConversationWithMessage = {
  conversation: MessagesConversation
  last_message?: MessagesMessage
}
