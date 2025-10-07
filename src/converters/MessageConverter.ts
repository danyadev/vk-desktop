import { MessagesForeignMessage } from 'model/api-types/objects/MessagesForeignMessage'
import { MessagesMessage, MessagesMessageAction } from 'model/api-types/objects/MessagesMessage'
import { MessagesPinnedMessage } from 'model/api-types/objects/MessagesPinnedMessage'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useViewerStore } from 'store/viewer'
import { fromApiAttaches } from 'converters/AttachConverter'
import { fromApiConvoStyle } from 'converters/ConvoConverter'
import { isNonEmptyArray, NonEmptyArray, typeguard } from 'misc/utils'

export function fromApiMessage(message: MessagesMessage): Message.Confirmed {
  const baseMessage: Message.BaseMessage = {
    peerId: Peer.resolveId(message.peer_id),
    cmid: Message.resolveCmid(message.conversation_message_id),
    authorId: Peer.resolveOwnerId(message.from_id),
    isOut: message.out === 1,
    sentAt: message.date * 1000,
    updatedAt: message.update_time
      ? message.update_time * 1000
      : undefined,
    randomId: message.random_id ?? 0
  }

  const attaches = fromApiAttaches(message.attachments ?? [], !!message.was_listened)

  if (message.action) {
    return {
      kind: 'Service',
      action: fromApiMessageAction(message.action, attaches.photos?.[0]),
      ...baseMessage
    }
  }

  if (message.is_expired) {
    return {
      kind: 'Expired',
      ...baseMessage
    }
  }

  return {
    kind: 'Normal',
    text: message.text,
    attaches,
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
    ...baseMessage
  }
}

function fromApiMessageAction(
  action: MessagesMessageAction,
  photo?: Attach.Photo
): Message.ServiceAction {
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
      return { type: action.type, photo }

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

      return {
        type: action.type,
        peerId: Peer.resolveOwnerId(action.member_id)
      }
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
      console.warn('Unknown service action type', action)
      return { type: 'unknown' }
  }
}

function fromApiForeignMessage(
  foreignMessage: MessagesForeignMessage,
  rootPeerId: Peer.Id,
  rootCmid: Message.Cmid
): Message.Foreign {
  const viewer = useViewerStore()

  return {
    kind: 'Foreign',
    peerId: foreignMessage.peer_id
      ? Peer.resolveId(foreignMessage.peer_id)
      : undefined,
    cmid: foreignMessage.conversation_message_id
      ? Message.resolveCmid(foreignMessage.conversation_message_id)
      : undefined,
    rootPeerId,
    rootCmid,
    authorId: Peer.resolveOwnerId(foreignMessage.from_id),
    isOut: foreignMessage.from_id === viewer.id,
    sentAt: foreignMessage.date * 1000,
    text: foreignMessage.text,
    attaches: fromApiAttaches(foreignMessage.attachments ?? [], !!foreignMessage.was_listened),
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
  const viewer = useViewerStore()

  const peerId = Peer.resolveId(pinnedMessage.peer_id)
  const cmid = Message.resolveCmid(pinnedMessage.conversation_message_id)

  return {
    kind: 'Pinned',
    peerId,
    cmid,
    authorId: Peer.resolveOwnerId(pinnedMessage.from_id),
    isOut: pinnedMessage.from_id === viewer.id,
    sentAt: pinnedMessage.date * 1000,
    text: pinnedMessage.text,
    attaches: fromApiAttaches(pinnedMessage.attachments ?? [], true),
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
