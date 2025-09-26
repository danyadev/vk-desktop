import { computed, reactive, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'

type ListSelector =
  | { kind: 'List', name: 'main' | 'archive', unread: boolean }
  | { kind: 'Folder', id: number, unread: boolean }

const DEFAULT_SELECTOR = { kind: 'List', name: 'main', unread: false } satisfies ListSelector

export const useConvoList = () => {
  const { lists } = useConvosStore()
  const listSelector = shallowRef<ListSelector>(DEFAULT_SELECTOR)
  const selectList = (selector: ListSelector) => {
    listSelector.value = selector
  }

  const selectedList = computed(() => {
    const selector = listSelector.value

    if (selector.kind === 'List') {
      return lists[selector.name]
    }

    const folder = lists.folders.find((folder) => folder.id === selector.id)

    if (!folder) {
      selectList(DEFAULT_SELECTOR)
      return lists.main
    }

    return folder
  })

  const sortedConvoList = computed(() => {
    const peerIds = listSelector.value.unread
      ? selectedList.value.unreadPeerIds
      : selectedList.value.peerIds

    return [...peerIds].map(Convo.safeGet).sort(Convo.sorter)
  })

  return reactive({
    selectedList,
    selectList,
    sortedConvoList
  })
}
