import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { shortenCount } from 'misc/dateTime'
import { useFormatOnlineStatus } from './useFormatOnlineStatus'
import { useViewer } from './useViewer'

export const useConvoSubtitle = () => {
  const { lang } = useServices()
  const viewer = useViewer()
  const formatOnlineStatus = useFormatOnlineStatus()

  return (convo: Convo.Convo | undefined, peer: Peer.Peer): string => {
    if (peer.id === viewer.id) {
      return lang.use('me_peer_favorites_description')
    }

    switch (peer.kind) {
      case 'User':
        return formatOnlineStatus(peer)

      case 'Group': {
        return lang.usePlural('me_group_members_count', peer.membersCount, {
          count: shortenCount(peer.membersCount)
        })
      }

      case 'Chat': {
        if (convo?.kind === 'ChatConvo' && convo.status === 'left') {
          return lang.use('me_chat_leaved_status')
        }

        if (convo?.kind === 'ChatConvo' && convo.status === 'kicked') {
          return lang.use('me_chat_kicked_status')
        }

        const langKey = convo && Convo.isChannel(convo)
          ? 'me_group_members_count'
          : 'me_chat_members_count'
        return lang.usePlural(langKey, peer.membersCount, {
          count: shortenCount(peer.membersCount)
        })
      }
    }
  }
}
