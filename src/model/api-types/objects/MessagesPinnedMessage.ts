import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'
import { MessagesMessageAttachment } from 'model/api-types/objects/MessagesMessageAttachment'

export type MessagesPinnedMessage = {
  attachments?: MessagesMessageAttachment[]
  conversation_message_id: number
  id: number
  date: number
  from_id: number
  fwd_messages?: unknown[] // TODO
  geo?: unknown // TODO
  peer_id: number
  reply_message?: unknown // TODO
  text: string
  keyboard?: MessagesKeyboard
  out?: boolean
  is_unavailable?: boolean
  important?: boolean
}
