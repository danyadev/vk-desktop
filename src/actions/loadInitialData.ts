import { ENGINE_VERSION } from 'env/Engine'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { useEnv } from 'hooks'
import { CONVOS_PER_PAGE, PEER_FIELDS } from 'misc/constants'

export async function loadInitialData(onError: () => void) {
  const { api, engine } = useEnv()
  const { convoList, connection } = useConvosStore()

  // Не инициализируем повторно приложение во время разработки
  if (import.meta.env.DEV && connection.status !== 'init' && connection.status !== 'initFailed') {
    return
  }

  try {
    const [longpollParams, conversations] = await api.fetchParallel([
      api.buildMethod('messages.getLongPollServer', {
        lp_version: ENGINE_VERSION,
        need_pts: 1
      }),
      api.buildMethod('messages.getConversations', {
        count: CONVOS_PER_PAGE,
        extended: 1,
        fields: PEER_FIELDS
      })
    ])

    insertPeers({
      profiles: conversations.profiles,
      groups: conversations.groups
    })
    insertConvos(conversations.items)

    connection.status = 'connected'
    engine.start(longpollParams)
    engine.stop()

    convoList.loading = false
    convoList.hasMore = conversations.items.length === CONVOS_PER_PAGE
  } catch (err) {
    console.warn('[loadInitialData] loading error', err)
    connection.status = 'initFailed'
    onError()
  }
}
