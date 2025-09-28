import { computed, reactive, Ref, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import { useConvosStore } from 'store/convos'

type ListOptions =
  | { name: 'main' | 'archive' }
  | { name: 'folder', folderId: number }

export const useConvoList = (unread: Ref<boolean>) => {
  const { lists } = useConvosStore()
  const list = shallowRef<Lists.List>(lists.main)

  const selectList = (listOptions: ListOptions) => {
    if (listOptions.name === 'folder') {
      const folder = lists.folders.find((folder) => folder.id === listOptions.folderId)
      list.value = folder ?? lists.main
    } else {
      list.value = lists[listOptions.name]
    }
  }

  const convoList = computed(() => {
    const peerIds = unread.value
      ? list.value.unreadPeerIds
      : list.value.peerIds

    return {
      convos: [...peerIds].map(Convo.safeGet).sort(Convo.sorter),
      status: list.value.status
    }
  })

  return reactive({
    convoList,
    selectList
  })
}
