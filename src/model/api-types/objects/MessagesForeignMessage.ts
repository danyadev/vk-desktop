import {
  MessagesMessageAttachment,
  MessagesMessageAttachmentGeo
} from 'model/api-types/objects/MessagesMessageAttachment'

export type MessagesForeignMessage = {
  attachments?: MessagesMessageAttachment[]
  conversation_message_id: number
  date: number
  from_id: number
  fwd_messages?: MessagesForeignMessage[]
  geo?: MessagesMessageAttachmentGeo
  id?: number
  peer_id?: number
  reply_message?: MessagesForeignMessage
  text: string
  update_time?: number
  was_listened?: boolean
  was_played?: boolean
  payload?: string
  is_expired?: boolean
  is_unavailable?: boolean
}
