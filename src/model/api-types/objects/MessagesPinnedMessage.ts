import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'

// https://github.com/VKCOM/api-schema-typescript/blob/master/src/objects/messages/MessagesPinnedMessage.ts
export type MessagesPinnedMessage = {
  attachments?: unknown[] // TODO
  conversation_message_id?: number
  date: number
  from_id: number
  fwd_messages?: unknown[] // TODO
  geo?: unknown // TODO
  id: number
  peer_id: number
  reply_message?: unknown // TODO
  text: string
  keyboard?: MessagesKeyboard
}
