import { Ref, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Message from 'model/Message'
import { insertPeerModel, insertPeers } from 'actions'
import { fromApiConvo } from 'converters/ConvoConverter'
import { fromApiMessage } from 'converters/MessageConverter'
import { PEER_FIELDS } from 'misc/constants'

const PAGE_SIZE = 20

export const useMessageSearch = (query: Ref<string>, enabled: Ref<boolean>) => {
  const { api } = useServices()
  const results = shallowRef<Message.Confirmed[]>([])
  const status = shallowRef<'idle' | 'loading' | 'complete' | 'error'>('idle')
  const hasMore = shallowRef(false)
  let currentController: AbortController | undefined

  const fetchPage = async (reset: boolean) => {
    const q = query.value.trim()
    if (!enabled.value || !q) return

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
        if (conversation.peer.type !== 'chat' || !conversation.chat_settings) continue
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

  watch([query, enabled], ([value, isEnabled], _, onCleanup) => {
    results.value = []
    hasMore.value = false
    status.value = isEnabled && value.trim() ? 'loading' : 'idle'
    if (!isEnabled || !value.trim()) return

    const timeout = window.setTimeout(() => fetchPage(true), 300)
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
