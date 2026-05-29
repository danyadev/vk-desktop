import { MessagesConversation } from 'services/contracts/api/objects/MessagesConversation'
import { MessagesMessage } from 'services/contracts/api/objects/MessagesMessage'

export type MessagesConversationWithMessage = {
  conversation: MessagesConversation
  last_message?: MessagesMessage
}
