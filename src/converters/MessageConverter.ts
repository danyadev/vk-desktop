import { MessagesMessage, MessagesMessageAction } from 'model/api-types/objects/MessagesMessage'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { fromApiConvoStyle } from 'converters/ConvoConverter'
import { typeguard } from 'misc/utils'

export function fromApiMessage(message: MessagesMessage): Message.Message {
  if (!message.conversation_message_id) {
    throw new Error('[fromApiMessage] No message.conversation_message_id')
  }

  const authorId = Peer.resolveId(message.from_id)
  if (!Peer.isUserPeerId(authorId) && !Peer.isGroupPeerId(authorId)) {
    throw new Error('[fromApiMessage] message.from_id neither UserId nor GroupId')
  }

  const baseMessage = {
    cmid: Message.resolveCmid(message.conversation_message_id),
    peerId: Peer.resolveId(message.peer_id),
    authorId,
    isOut: !!message.out || message.peer_id === message.from_id,
    sentAt: message.date * 1000
  }

  if (message.action) {
    return {
      kind: 'Service',
      action: fromApiMessageAction(message.action),
      ...baseMessage
    }
  }

  if (message.is_expired) {
    if (!message.update_time) {
      throw new Error('[fromApiMessage Expired] No message.update_time')
    }

    return {
      kind: 'Expired',
      updatedAt: message.update_time * 1000,
      ...baseMessage
    }
  }

  return {
    kind: 'Normal',
    text: message.text,
    attachments: message.attachments ?? [],
    forwardedMessages: message.fwd_messages ?? [],
    updatedAt: message.update_time
      ? message.update_time * 1000
      : undefined,
    ...baseMessage
  }
}

function fromApiMessageAction(action: MessagesMessageAction): Message.ServiceAction {
  switch (action.type) {
    case 'chat_create':
      return {
        type: action.type,
        title: action.text ?? ''
      }

    case 'chat_title_update':
      return {
        type: action.type,
        title: action.text ?? '',
        oldTitle: action.old_text ?? ''
      }

    case 'chat_photo_update':
      return {
        type: action.type,
        photo: action.photo && {
          photo50: action.photo.photo_50,
          photo100: action.photo.photo_100,
          photo200: action.photo.photo_200
        }
      }

    case 'chat_photo_remove':
    case 'chat_kick_don':
    case 'call_transcription_failed':
    case 'chat_invite_user_by_link':
    case 'chat_screenshot':
    case 'chat_group_call_started':
    case 'chat_invite_user_by_call_join_link':
      return { type: action.type }

    case 'chat_invite_user':
    case 'chat_kick_user':
    case 'accepted_message_request': {
      if (!action.member_id) {
        return { type: 'unknown' }
      }

      const peerId = Peer.resolveId(action.member_id)
      if (!Peer.isUserPeerId(peerId) && !Peer.isGroupPeerId(peerId)) {
        return { type: 'unknown' }
      }

      return { type: action.type, peerId }
    }

    case 'chat_invite_user_by_message_request':
    case 'chat_invite_user_by_call':
    case 'chat_kick_user_call_block': {
      if (!action.member_id) {
        return { type: 'unknown' }
      }

      const peerId = Peer.resolveId(action.member_id)
      if (!Peer.isUserPeerId(peerId)) {
        return { type: 'unknown' }
      }

      return { type: action.type, peerId }
    }

    case 'chat_pin_message':
    case 'chat_unpin_message':
      if (!action.conversation_message_id) {
        return { type: 'unknown' }
      }

      return {
        type: action.type,
        cmid: Message.resolveCmid(action.conversation_message_id),
        message: action.message ?? ''
      }

    case 'conversation_style_update':
    case 'conversation_style_update_action':
      return {
        type: action.type,
        style: action.style ? fromApiConvoStyle(action.style) : undefined
      }

    case 'custom':
      return {
        type: action.type,
        message: action.message ?? ''
      }

    default:
      typeguard(action.type)
      console.warn(action)
      return { type: 'unknown' }
  }
}
