import { MessagesForeignMessage } from 'model/api-types/objects/MessagesForeignMessage'
import { MessagesMessage, MessagesMessageAction } from 'model/api-types/objects/MessagesMessage'
import { MessagesPinnedMessage } from 'model/api-types/objects/MessagesPinnedMessage'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { fromApiAttaches } from 'converters/AttachConverter'
import { fromApiConvoStyle } from 'converters/ConvoConverter'
import { isNonEmptyArray, NonEmptyArray, typeguard } from 'misc/utils'

export function fromApiMessage(message: MessagesMessage): Message.Message {
  const authorId = Peer.resolveId(message.from_id)
  if (!Peer.isUserPeerId(authorId) && !Peer.isGroupPeerId(authorId)) {
    throw new Error('[fromApiMessage] message.from_id neither UserId nor GroupId')
  }

  const baseMessage = {
    peerId: Peer.resolveId(message.peer_id),
    cmid: Message.resolveCmid(message.conversation_message_id),
    authorId,
    isOut: message.out === 1,
    sentAt: message.date * 1000
  } satisfies Partial<Message.Message>

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
    attaches: fromApiAttaches(message.attachments ?? []),
    replyMessage: message.reply_message && fromApiForeignMessage(
      message.reply_message,
      baseMessage.peerId,
      baseMessage.cmid
    ),
    forwardedMessages: fromApiForwardedMessages(
      message.fwd_messages ?? [],
      baseMessage.peerId,
      baseMessage.cmid
    ),
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

function fromApiForeignMessage(
  foreignMessage: MessagesForeignMessage,
  rootPeerId: Peer.Id,
  rootCmid: Message.Cmid
): Message.Foreign {
  const authorId = Peer.resolveId(foreignMessage.from_id)
  if (!Peer.isUserPeerId(authorId) && !Peer.isGroupPeerId(authorId)) {
    throw new Error('[fromApiForeignMessage] foreignMessage.from_id neither UserId nor GroupId')
  }

  return {
    kind: 'Foreign',
    peerId: foreignMessage.peer_id
      ? Peer.resolveId(foreignMessage.peer_id)
      : undefined,
    cmid: Message.resolveCmid(foreignMessage.conversation_message_id),
    rootPeerId,
    rootCmid,
    authorId,
    sentAt: foreignMessage.date * 1000,
    text: foreignMessage.text,
    attaches: fromApiAttaches(foreignMessage.attachments ?? []),
    replyMessage: foreignMessage.reply_message && fromApiForeignMessage(
      foreignMessage.reply_message,
      rootPeerId,
      rootCmid
    ),
    forwardedMessages: fromApiForwardedMessages(
      foreignMessage.fwd_messages ?? [],
      rootPeerId,
      rootCmid
    ),
    updatedAt: foreignMessage.update_time
      ? foreignMessage.update_time * 1000
      : undefined,
    isUnavailable: !!foreignMessage.is_unavailable
  }
}

function fromApiForwardedMessages(
  apiForwardedMessages: MessagesForeignMessage[],
  rootPeerId: Peer.Id,
  rootCmid: Message.Cmid
): NonEmptyArray<Message.Foreign> | undefined {
  const forwardedMessages = apiForwardedMessages.map((foreign) => fromApiForeignMessage(
    foreign,
    rootPeerId,
    rootCmid
  ))

  if (!isNonEmptyArray(forwardedMessages)) {
    return undefined
  }

  return forwardedMessages
}

export function fromApiPinnedMessage(pinnedMessage: MessagesPinnedMessage): Message.Pinned {
  const authorId = Peer.resolveId(pinnedMessage.from_id)
  if (!Peer.isUserPeerId(authorId) && !Peer.isGroupPeerId(authorId)) {
    throw new Error('[fromApiPinnedMessage] pinnedMessage.from_id neither UserId nor GroupId')
  }

  const peerId = Peer.resolveId(pinnedMessage.peer_id)
  const cmid = Message.resolveCmid(pinnedMessage.conversation_message_id)

  return {
    kind: 'Pinned',
    peerId,
    cmid,
    authorId,
    sentAt: pinnedMessage.date * 1000,
    text: pinnedMessage.text,
    attaches: fromApiAttaches(pinnedMessage.attachments ?? []),
    replyMessage: pinnedMessage.reply_message && fromApiForeignMessage(
      pinnedMessage.reply_message,
      peerId,
      cmid
    ),
    forwardedMessages: fromApiForwardedMessages(
      pinnedMessage.fwd_messages ?? [],
      peerId,
      cmid
    ),
    isUnavailable: !!pinnedMessage.is_unavailable
  }
}
