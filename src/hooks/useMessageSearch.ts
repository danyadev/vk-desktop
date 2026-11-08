import { onActivated, onDeactivated, onScopeDispose, reactive, Ref, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Message from 'model/Message'
import { insertPeerModel, insertPeers } from 'actions'
import { fromApiConvo } from 'converters/ConvoConverter'
import { fromApiMessage } from 'converters/MessageConverter'
import { PEER_FIELDS } from 'misc/constants'

const PAGE_SIZE = 20

export const useMessageSearch = (query: Ref<string>) => {
  const { api } = useServices()
  const results = shallowRef<Message.Confirmed[]>([])
  const status = shallowRef<'idle' | 'loading' | 'hasMore' | 'complete' | 'error'>('idle')
  const active = shallowRef(true)
  let searchedQuery = ''
  let currentController: AbortController | undefined

  const updateQuery = (q: string) => {
    if (q === searchedQuery) return false

    currentController?.abort()
    searchedQuery = q
    results.value = []
    status.value = q ? 'loading' : 'idle'

    return !!q
  }

  const loadMore = async () => {
    const q = query.value.trim()
    if (!q) return

    const controller = new AbortController()
    currentController?.abort()
    currentController = controller
    status.value = 'loading'

    try {
      const { count, items, profiles, groups, conversations } = await api.fetch('messages.search', {
        q,
        offset: results.value.length,
        count: PAGE_SIZE,
        extended: 1,
        fields: PEER_FIELDS
      }, { signal: controller.signal })

      if (controller.signal.aborted) return

      insertPeers({ profiles, groups })
      for (const conversation of conversations ?? []) {
        const { peer } = fromApiConvo(conversation)
        if (peer) insertPeerModel(peer)
      }

      const messages = items.map(fromApiMessage)
      results.value = [...results.value, ...messages]
      status.value = results.value.length < count && items.length > 0 ? 'hasMore' : 'complete'
    } catch (error) {
      if (controller.signal.aborted) return
      console.warn('[useMessageSearch] Search failed', error)
      status.value = 'error'
    }
  }

  onActivated(() => (active.value = true))
  onDeactivated(() => (active.value = false))
  onScopeDispose(() => currentController?.abort())

  watch(query, (value, _, onCleanup) => {
    if (!active.value || !updateQuery(value.trim())) return

    const timeout = window.setTimeout(loadMore, 300)
    onCleanup(() => window.clearTimeout(timeout))
  })

  watch(active, (isActive) => {
    if (isActive && updateQuery(query.value.trim())) {
      loadMore()
    }
  }, { immediate: true })

  return reactive({ results, status, loadMore })
}
