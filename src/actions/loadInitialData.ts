import { useServices } from 'services'
import * as IEngine from 'services/contracts/IEngine'
import * as ConvoDraft from 'model/ConvoDraft'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers, syncDraftsOnLoad } from 'actions'
import { CONVOS_PER_PAGE, PEER_FIELDS } from 'misc/constants'

export async function loadInitialData(
  onLoadError: () => void,
  onEngineFail: (reason: IEngine.FailReason) => void
) {
  const { api, engine } = useServices()
  const { convoDrafts, lists, connection } = useConvosStore()

  // Не инициализируем повторно приложение во время разработки
  if (import.meta.env.DEV && connection.status !== 'init' && connection.status !== 'initFailed') {
    return
  }

  connection.status = 'init'

  const draftPeerIds = [...convoDrafts]
    .filter(([, draft]) => !ConvoDraft.isEmpty(draft))
    .map(([peerId]) => peerId)

  try {
    const [longpollParams, conversations, draftedConversations] = await api.fetchParallel([
      api.buildMethod('messages.getLongPollServer', {
        lp_version: IEngine.VERSION,
        need_pts: 1
      }),
      api.buildMethod('messages.getConversations', {
        count: CONVOS_PER_PAGE,
        extended: 1,
        fields: PEER_FIELDS
      }),
      draftPeerIds.length > 0 && api.buildMethod('messages.getConversationsById', {
        peer_ids: draftPeerIds.join(','),
        with_last_messages: 1,
        extended: 1,
        fields: PEER_FIELDS
      })
    ], { retries: 2 })

    insertPeers({
      profiles: conversations.profiles,
      groups: conversations.groups
    })
    insertConvos(conversations.items, { list: lists.main })

    if (draftedConversations) {
      insertPeers({
        profiles: draftedConversations.profiles,
        groups: draftedConversations.groups
      })

      const lastMessages = new Map(
        draftedConversations.last_messages?.map((message) => [message.peer_id, message])
      )
      insertConvos(draftedConversations.items.map((conversation) => ({
        conversation,
        last_message: lastMessages.get(conversation.peer.id)
      })))
    }

    lists.main.status = conversations.items.length === CONVOS_PER_PAGE ? 'hasMore' : 'complete'

    connection.status = 'connected'
    engine.start(longpollParams, onEngineFail)
    syncDraftsOnLoad()

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
