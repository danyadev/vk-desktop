import { MessagesForeignMessage } from 'services/contracts/api/objects/MessagesForeignMessage'
import { MessagesKeyboard } from 'services/contracts/api/objects/MessagesKeyboard'
import {
  MessagesMessageAttachment,
  MessagesMessageAttachmentGeo
} from 'services/contracts/api/objects/MessagesMessageAttachment'

export type MessagesPinnedMessage = {
  attachments?: MessagesMessageAttachment[]
  conversation_message_id: number
  id: number
  date: number
  from_id: number
  fwd_messages?: MessagesForeignMessage[]
  geo?: MessagesMessageAttachmentGeo
  peer_id: number
  reply_message?: MessagesForeignMessage
  text: string
  keyboard?: MessagesKeyboard
  out?: boolean
  is_unavailable?: boolean
  important?: boolean
}
