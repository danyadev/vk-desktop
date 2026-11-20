import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'

export const useMessageAuthorName = () => {
  const { lang } = useServices()
  const { peers } = usePeersStore()

  return (message: Message.Message | undefined, convo?: Convo.Convo): string => {
    if (!message || message.kind === 'Service') return ''
    if (convo?.kind === 'ChatConvo' && convo.isChannel) return ''

    let author: string

    if (message.isOut) {
      author = lang.use('me_convo_list_author_you')
    } else if (Peer.isChatPeerId(message.peerId)) {
      author = Peer.firstName(Peer.safeGet(peers, message.authorId))
    } else {
      return ''
    }

    return lang.use('me_convo_list_author', { author }) + ' '
  }
}
