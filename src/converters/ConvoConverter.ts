import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { typeguard } from 'misc/utils'
import { fromApiMessage, fromApiPinnedMessage } from './MessageConverter'

export function fromApiConvo(
  apiConvo: MessagesConversation,
  apiLastMessage?: MessagesMessage
):
  | { convo: Convo.ChatConvo, peer: Peer.Chat }
  | { convo?: Exclude<Convo.Convo, Convo.ChatConvo>, peer?: undefined } {
  const lastMessage = apiLastMessage && fromApiMessage(apiLastMessage)
  const lastCmid = apiConvo.last_conversation_message_id
  const history: History.History<Message.Message> = []

  if (lastMessage) {
    if (lastCmid > 1) {
      history.push(History.toGap(1, lastCmid - 1))
    }

    history.push(History.toItem(lastMessage.cmid, lastMessage))
  } else if (lastCmid > 0) {
    history.push(History.toGap(1, lastCmid))
  }

  const baseConvo = {
    history,
    unreadCount: apiConvo.unread_count ?? 0,
    majorSortId: apiConvo.sort_id?.major_id ?? 0,
    minorSortId: apiConvo.sort_id?.minor_id ?? 0,
    inReadBy: apiConvo.in_read_cmid,
    outReadBy: apiConvo.out_read_cmid,
    notifications: {
      enabled: (
        !apiConvo.push_settings?.disabled_until &&
        !apiConvo.push_settings?.disabled_forever
      ),
      disabledUntil: (apiConvo.push_settings?.disabled_until ?? 0) * 1000
    }
  } satisfies Partial<Convo.Convo>

  const peerId = Peer.resolveId(apiConvo.peer.id)

  switch (apiConvo.peer.type) {
    case 'user':
      if (!Peer.isUserPeerId(peerId)) {
        throw new Error('User with out of range id: ' + peerId)
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
        throw new Error('Group with out of range id: ' + peerId)
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
        throw new Error('Chat with out of range id: ' + peerId)
      }

      if (!apiConvo.chat_settings) {
        console.warn('Chat without chat_settings', apiConvo)
        throw new Error('Chat without chat_settings: ' + peerId)
      }

      return {
        convo: {
          kind: 'ChatConvo',
          id: peerId,
          status: apiConvo.chat_settings.state,
          isChannel: !!apiConvo.chat_settings.is_group_channel,
          isCasper: !!apiConvo.chat_settings.is_disappearing,
          pinnedMessage: apiConvo.chat_settings.pinned_message
            ? fromApiPinnedMessage(apiConvo.chat_settings.pinned_message)
            : undefined,
          ...baseConvo
        },
        peer: {
          kind: 'Chat',
          id: peerId,
          title: apiConvo.chat_settings.title,
          photo50: apiConvo.chat_settings.photo?.photo_50,
          photo100: apiConvo.chat_settings.photo?.photo_100,
          membersCount: apiConvo.chat_settings.members_count ?? 0
        }
      }

    case 'email': // Устаревший тип чата, не будет поддержан
    case 'contact': // В данный момент не поддерживаем
      return {}

    default:
      typeguard(apiConvo.peer.type)
      return {}
  }
}

export function fromApiConvoStyle(style: string): Convo.Style {
  switch (style) {
    case 'default':
    case 'disco':
    case 'twilight':
    case 'sunset':
    case 'lagoon':
    case 'marine':
    case 'retrowave':
    case 'candy':
    case 'crimson':
    case 'emerald':
    case 'halloween_orange':
    case 'halloween_violet':
    case 'unicorn':
    case 'midnight':
    case 'easter_egg':
    case 'frost':
    case 'new_year':
    case 'valentine':
    case 'warm_valentine':
    case 'womens_day':
    case 'mable':
    case 'vk17':
    case 'gamer':
    case 'gifts':
    case 'sberkot':
      return style
    default:
      return 'unknown'
  }
}
