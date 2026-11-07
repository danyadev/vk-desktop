import { computed } from 'vue'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Lists from 'model/Lists'
import { useConvosStore } from 'store/convos'

export const useConvoList = (list: Lists.List) => {
  const { convos, convoDrafts } = useConvosStore()

  return computed(() => {
    const peerIds = new Set(list.peerIds)

    for (const [peerId, draft] of convoDrafts) {
      const convo = convos.get(peerId)
      if (convo && !ConvoDraft.isEmpty(draft) && Lists.matches(list, convo)) {
        peerIds.add(peerId)
      }
    }

    return [...peerIds]
      .map((peerId) => Convo.safeGet(convos, peerId))
      .sort((a, b) => Convo.sorter(a, b, convoDrafts))
  })
}
