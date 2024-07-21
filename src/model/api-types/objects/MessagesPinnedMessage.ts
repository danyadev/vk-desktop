import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'

export type MessagesPinnedMessage = {
  attachments?: unknown[] // TODO
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
