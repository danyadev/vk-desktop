import { computed, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import { useConvosStore } from 'store/convos'

type ListConfig =
  | { name: 'main' | 'unread' | 'archive' }
  | { name: 'folder' | 'unreadFolder', folderId: number }

export const useConvoList = () => {
  const { lists } = useConvosStore()
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

  const convoList = computed(() => [...list.value.peerIds].map(Convo.safeGet).sort(Convo.sorter))

  return computed(() => ({
    convoList: convoList.value,
    selectList,
    list: list.value
  }))
}
