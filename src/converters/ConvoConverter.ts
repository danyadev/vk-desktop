import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { typeguard } from 'misc/utils'
import { fromApiMessage } from './MessageConverter'

export function fromApiConvo(
  apiConvo: MessagesConversation,
  apiLastMessage?: MessagesMessage
):
  | { convo: Convo.ChatConvo, peer: Peer.Chat }
  | { convo?: Exclude<Convo.Convo, Convo.ChatConvo>, peer?: undefined } {
  const lastMessage = apiLastMessage && fromApiMessage(apiLastMessage)
  const lastCmid = apiConvo.last_conversation_message_id ?? 0
  const history: History.History = []

  if (lastMessage) {
    if (lastCmid > 1) {
      history.push({
        kind: 'Gap',
        fromCmid: Message.resolveCmid(1),
        toCmid: Message.resolveCmid(lastCmid - 1)
      })
    }

    history.push(lastMessage)
  } else if (lastCmid > 0) {
    history.push({
      kind: 'Gap',
      fromCmid: Message.resolveCmid(1),
      toCmid: Message.resolveCmid(lastCmid)
    })
  }

  const baseConvo = {
    history,
    unreadCount: apiConvo.unread_count ?? 0,
    enabledNotifications: !apiConvo.push_settings,
    majorSortId: apiConvo.sort_id?.major_id ?? 0,
    minorSortId: apiConvo.sort_id?.minor_id ?? 0,
    inReadBy: Message.resolveCmid(apiConvo.in_read_cmid),
    outReadBy: Message.resolveCmid(apiConvo.out_read_cmid)
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

      return {
        convo: {
          kind: 'ChatConvo',
          id: peerId,
          isChannel: !!apiConvo.chat_settings?.is_group_channel,
          isCasper: !!apiConvo.chat_settings?.is_disappearing,
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
