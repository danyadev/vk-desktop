import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'

export function fromApiMessage(message: MessagesMessage): Message.Message {
  if (!message.conversation_message_id) {
    throw new Error('[fromApiMessage] No message.conversation_message_id')
  }

  const cmid = Message.resolveCmid(message.conversation_message_id)
  const peerId = Peer.resolveId(message.peer_id)
  const authorId = Peer.resolveId(message.from_id)
  const isOut = !!message.out || message.peer_id === message.from_id
  const sentAt = message.date * 1000

  if (message.action) {
    return {
      kind: 'Service',
      cmid,
      peerId,
      authorId,
      isOut,
      sentAt
    }
  }

  if (message.is_expired) {
    if (!message.update_time) {
      throw new Error('[fromApiMessage Expired] No message.update_time')
    }

    return {
      kind: 'Expired',
      cmid,
      peerId,
      authorId,
      isOut,
      sentAt,
      updatedAt: message.update_time * 1000
    }
  }

  return {
    kind: 'Normal',
    cmid,
    peerId,
    authorId,
    isOut,
    text: message.text,
    attachments: message.attachments ?? [],
    sentAt,
    updatedAt: message.update_time
      ? message.update_time * 1000
      : undefined
  }
}
