import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { useEnv } from 'hooks'
import { CONVOS_PER_PAGE, PEER_FIELDS } from 'misc/constants'

export async function loadMoreConvos() {
  const { api } = useEnv()
  const { convoList } = useConvosStore()

  if (convoList.loading) {
    return
  }

  const lastConvoId = convoList.peerIds.at(-1)
  const convo = lastConvoId && Convo.safeGet(lastConvoId)

  if (!convo?.minorSortId) {
    console.error('чет не то')
    return
  }

  convoList.loading = true

  const response = await api.fetch('messages.getConversations', {
    start_from_minor_sort_id: convo.minorSortId,
    count: CONVOS_PER_PAGE,
    fields: PEER_FIELDS,
    extended: 1
  })

  insertPeers({
    profiles: response.profiles,
    groups: response.groups
  })
  insertConvos(response.items)

  convoList.loading = false
  convoList.hasMore = response.items.length === CONVOS_PER_PAGE
}
