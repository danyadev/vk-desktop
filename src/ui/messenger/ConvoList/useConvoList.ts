import { computed, reactive, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import { useConvosStore } from 'store/convos'

type ListConfig =
  | { name: 'main' | 'archive', unread: boolean }
  | { name: 'folder', folderId: number, unread: boolean }

export const useConvoList = () => {
  const { lists } = useConvosStore()
  const list = shallowRef<Lists.List>(lists.main.all)

  const selectList = (config: ListConfig) => {
    const sublist = config.unread ? 'unread' : 'all'

    if (config.name === 'folder') {
      const folder = lists.folders.find((folderCouple) => (
        folderCouple[sublist].id === config.folderId
      ))
      list.value = (folder ?? lists.main)[sublist]
    } else {
      list.value = lists[config.name][sublist]
    }
  }

  const convoList = computed(() => {
    console.log('computed', list.value.peerIds)
    return {
      convos: [...list.value.peerIds].map(Convo.safeGet).sort(Convo.sorter),
      status: list.value.status,
      list
    }
  })

  return reactive({
    convoList,
    selectList
  })
}
