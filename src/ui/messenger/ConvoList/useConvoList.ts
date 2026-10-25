import { computed, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Lists from 'model/Lists'
import { useConvosStore } from 'store/convos'

type ListConfig =
  | { name: 'main' | 'unread' | 'archive' }
  | { name: 'folder' | 'unreadFolder', folderId: number }

export const useConvoList = () => {
  const { convos, convoDrafts, lists } = useConvosStore()
  const list = shallowRef<Lists.List>(lists.main)

  const selectList = (config: ListConfig) => {
    if (config.name === 'folder' || config.name === 'unreadFolder') {
      const sublist = config.name === 'folder' ? 'all' : 'unread'
      const folder = lists.folders.get(config.folderId)
      if (folder) {
        list.value = folder[sublist]
      }
    } else {
      list.value = lists[config.name]
    }
  }

  const convoList = computed(() => {
    const peerIds = new Set(list.value.peerIds)

    for (const [peerId, draft] of convoDrafts) {
      const convo = convos.get(peerId)
      if (convo && !ConvoDraft.isEmpty(draft) && Lists.matches(list.value, convo)) {
        peerIds.add(peerId)
      }
    }

    return [...peerIds]
      .map((peerId) => Convo.safeGet(convos, peerId))
      .sort((a, b) => Convo.sorter(a, b, convoDrafts))
  })

  return computed(() => ({
    convoList: convoList.value,
    selectList,
    list: list.value
  }))
}
