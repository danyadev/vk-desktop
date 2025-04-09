import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { fromApiConvo } from 'converters/ConvoConverter'

export function insertConvos(
  conversations: MessagesConversationWithMessage[],
  { merge = false, addToList = true } = {}
) {
  const { convoList, convos } = useConvosStore()
  const { peers } = usePeersStore()

  for (const apiConvo of conversations) {
    const { convo, peer } = fromApiConvo(apiConvo.conversation, apiConvo.last_message)

    if (convo) {
      const localConvo = convos.get(convo.id)

      if (localConvo) {
        convo.pendingMessages = localConvo.pendingMessages
      }

      if (localConvo && merge) {
        convo.history = localConvo.history
      }

      if (!localConvo || merge) {
        convos.set(convo.id, convo)
      }

      if (addToList) {
        convoList.peerIds.push(convo.id)
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
