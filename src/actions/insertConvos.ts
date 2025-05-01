import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { fromApiConvo } from 'converters/ConvoConverter'

export function insertConvos(
  conversations: MessagesConversationWithMessage[],
  { mergeHistory = true, addToList = true } = {}
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

      if (localConvo && mergeHistory) {
        convo.history = localConvo.history
        convo.historyAroundCmid = localConvo.historyAroundCmid
      }

      convos.set(convo.id, convo)

      if (addToList && !convoList.peerIds.includes(convo.id)) {
        convoList.peerIds.push(convo.id)
      }
    }

    if (peer) {
      peers.set(peer.id, peer)
    }
  }

  convoList.peerIds = convoList.peerIds
    .map(Convo.safeGet)
    .sort(Convo.sorter)
    .map((convo) => convo.id)
}
