import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { fromApiConvo } from 'converters/ConvoConverter'

export function insertConvos(conversations: MessagesConversationWithMessage[]) {
  const { convoList, convos } = useConvosStore()
  const { peers } = usePeersStore()

  for (const apiConvo of conversations) {
    const { convo, peer } = fromApiConvo(apiConvo.conversation, apiConvo.last_message)

    if (convo) {
      convoList.peerIds.push(convo.id)
      // Мы держим конву в актуальном состоянии через лонгполл.
      // Перезапись конвы в кеше сбросила бы список сообщений
      if (!convos.get(convo.id)) {
        convos.set(convo.id, convo)
      }
    }

    if (peer) {
      peers.set(peer.id, peer)
    }
  }

  convoList.peerIds = [...new Set(convoList.peerIds)]
    .map(Convo.safeGet)
    .sort(Convo.sorter)
    .map((convo) => convo.id)
}
