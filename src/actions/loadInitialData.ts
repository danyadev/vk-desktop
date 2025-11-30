import * as IEngine from 'env/IEngine'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { useEnv } from 'hooks'
import { CONVOS_PER_PAGE, PEER_FIELDS } from 'misc/constants'

export async function loadInitialData(
  onLoadError: () => void,
  onEngineFail: (reason: IEngine.FailReason) => void
) {
  const { api, engine } = useEnv()
  const { lists, connection } = useConvosStore()

  // Не инициализируем повторно приложение во время разработки
  if (import.meta.env.DEV && connection.status !== 'init' && connection.status !== 'initFailed') {
    return
  }

  connection.status = 'init'

  try {
    const [longpollParams, conversations] = await api.fetchParallel([
      api.buildMethod('messages.getLongPollServer', {
        lp_version: IEngine.VERSION,
        need_pts: 1
      }),
      api.buildMethod('messages.getConversations', {
        count: CONVOS_PER_PAGE,
        extended: 1,
        fields: PEER_FIELDS
      })
    ], { retries: 2 })

    insertPeers({
      profiles: conversations.profiles,
      groups: conversations.groups
    })
    insertConvos(conversations.items, { list: lists.main })

    lists.main.status = conversations.items.length === CONVOS_PER_PAGE ? 'hasMore' : 'complete'

    connection.status = 'connected'
    engine.start(longpollParams, onEngineFail)

    if (!import.meta.env.DEV) {
      api
        .fetch('stats.trackVisitor', {})
        .catch((err: unknown) => {
          console.warn('[loadInitialData] stats.trackVisitor has failed', err)
        })
    }
  } catch (err) {
    console.warn('[loadInitialData] loading error', err)
    connection.status = 'initFailed'
    onLoadError()
  }
}
