import * as Lists from 'model/Lists'
import { insertConvos, insertPeers } from 'actions'
import { useEnv } from 'hooks'
import { CONVOS_PER_PAGE, PEER_FIELDS } from 'misc/constants'

export async function loadMoreConvos(list: Lists.List) {
  const { api } = useEnv()

  if (list.status === 'loading') {
    return
  }

  try {
    list.status = 'loading'

    const response = await api.fetch('messages.getConversations', {
      filter: mapListToFilter(list),
      folder_id: list.kind === 'FolderList'
        ? list.id
        : undefined,
      start_from_minor_sort_id: list.boundary.minorId === Infinity
        ? undefined
        : list.boundary.minorId,
      count: CONVOS_PER_PAGE,
      fields: PEER_FIELDS,
      extended: 1
    })

    insertPeers({
      profiles: response.profiles,
      groups: response.groups
    })
    insertConvos(response.items, { list })

    list.status = response.items.length === CONVOS_PER_PAGE ? 'hasMore' : 'complete'
  } catch (err) {
    console.warn('[loadMoreConvos] loading error', err)
    list.status = 'error'
  }
}

function mapListToFilter(list: Lists.List) {
  switch (list.name) {
    case 'main':
    case 'folder':
      return 'all'

    case 'unread':
    case 'unreadFolder':
      return 'unread'

    case 'archive':
      return 'archive'
  }
}
