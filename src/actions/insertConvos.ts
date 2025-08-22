import { MessagesConversationWithMessage } from 'model/api-types/objects/MessagesConversationWithMessage'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
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

        if (mergeHistory) {
          const messages = convo.history.filter((node) => node.kind === 'Item')
          History.insert(localConvo.history, messages, {
            up: true,
            down: true,
            aroundId: 0
          })

          convo.history = localConvo.history
          convo.historySliceAnchorCmid = localConvo.historySliceAnchorCmid
        }

        // Само присваивание нового объекта является триггером для перерисовки всех компонентов,
        // где был запрошен указанный пир, поэтому для дальнейшей оптимизации можно не создавать
        // новый объект, а перезаписывать его поля, многие их которых почти никогда не меняются.
        // Это безопасно: все объекты одинакового типа (kind) имеют полный и одинаковый набор полей,
        // опциональные поля всегда заполняются как явный undefined, сохраняя единую форму
        Object.assign(localConvo, convo)
      } else {
        convos.set(convo.id, convo)
      }

      if (addToList && !convoList.peerIds.includes(convo.id)) {
        convoList.peerIds.push(convo.id)
      }
    }

    if (peer) {
      const localPeer = peers.get(peer.id)
      if (localPeer) {
        Object.assign(localPeer, peer)
      } else {
        peers.set(peer.id, peer)
      }
    }
  }

  convoList.peerIds = convoList.peerIds
    .map(Convo.safeGet)
    .sort(Convo.sorter)
    .map((convo) => convo.id)
}
