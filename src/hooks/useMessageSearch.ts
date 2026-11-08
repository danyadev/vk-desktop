import { onActivated, onDeactivated, Ref, shallowRef, watch } from 'vue'
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
  const status = shallowRef<'idle' | 'loading' | 'complete' | 'error'>('idle')
  const hasMore = shallowRef(false)
  const active = shallowRef(true)
  let searchedQuery = ''
  let currentController: AbortController | undefined

  const fetchPage = async (reset: boolean) => {
    const q = query.value.trim()
    if (!q) return

    const controller = new AbortController()
    currentController?.abort()
    currentController = controller

    const offset = reset ? 0 : results.value.length
    status.value = 'loading'

    try {
      const { count, items, profiles, groups, conversations } = await api.fetch('messages.search', {
        q,
        offset,
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
      results.value = reset ? messages : [...results.value, ...messages]
      hasMore.value = offset + items.length < count && items.length > 0
      status.value = 'complete'
    } catch (error) {
      if (controller.signal.aborted) return
      console.warn('[useMessageSearch] Search failed', error)
      status.value = 'error'
    }
  }

  onActivated(() => (active.value = true))
  onDeactivated(() => (active.value = false))

  watch([query, active], ([value, isActive], _, onCleanup) => {
    if (!isActive) return

    const q = value.trim()
    const changed = q !== searchedQuery
    if (changed) {
      searchedQuery = q
      results.value = []
      hasMore.value = false
      status.value = q ? 'loading' : 'idle'
    }
    if (!q || (!changed && (status.value === 'complete' || status.value === 'error'))) return

    const timeout = window.setTimeout(() => fetchPage(results.value.length === 0), 300)
    onCleanup(() => {
      window.clearTimeout(timeout)
      currentController?.abort()
    })
  }, { immediate: true })

  const loadMore = () => {
    if (hasMore.value && status.value === 'complete') fetchPage(false)
  }

  const retry = () => {
    if (status.value !== 'loading') fetchPage(results.value.length === 0)
  }

  return { results, status, hasMore, loadMore, retry }
}
