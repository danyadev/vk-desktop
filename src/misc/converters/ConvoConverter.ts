import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { typeguard } from 'misc/utils'

export function fromApiConvo(
  apiConvo: MessagesConversation
):
  | { convo: Convo.ChatConvo, peer: Peer.Chat }
  | { convo?: Exclude<Convo.Convo, Convo.ChatConvo>, peer?: undefined } {
  const baseConvo = {
    unreadCount: apiConvo.unread_count ?? 0
  }

  const peerId = Peer.resolveId(apiConvo.peer.id)

  switch (apiConvo.peer.type) {
    case 'user':
      if (!Peer.isUserPeerId(peerId)) {
        return {}
      }

      return {
        convo: {
          kind: 'UserConvo',
          id: peerId,
          ...baseConvo
        }
      }

    case 'group':
      if (!Peer.isGroupPeerId(peerId)) {
        return {}
      }

      return {
        convo: {
          kind: 'GroupConvo',
          id: peerId,
          ...baseConvo
        }
      }

    case 'chat':
      if (!Peer.isChatPeerId(peerId)) {
        return {}
      }

      return {
        convo: {
          kind: 'ChatConvo',
          id: peerId,
          ...baseConvo
        },
        peer: {
          kind: 'Chat',
          id: peerId,
          title: apiConvo.chat_settings?.title ?? '',
          photo50: apiConvo.chat_settings?.photo?.photo_50,
          photo100: apiConvo.chat_settings?.photo?.photo_100
        }
      }

    case 'email':
      // Устаревший тип чата, не будет поддержан
      return {}

    default:
      typeguard(apiConvo.peer.type)
      return {}
  }
}
